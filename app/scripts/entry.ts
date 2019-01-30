import { PackageID, getPackages } from './packages';
import Dexie from 'dexie';

export enum State {
    Unknown,
    Marked,
    Known,
}

interface EntryKey {
    pkgId: PackageID;
    key: string;
}

export interface UnknownEntry extends EntryKey {
    state: State.Unknown;
}

export interface MarkedEntry extends EntryKey {
    state: State.Marked;
    date: number;
    source: {
        url: string;
        title: string;
    };
    context: {
        begin: number;
        end: number;
        text: string;
    };
}

export interface KnownEntry extends EntryKey {
    state: State.Known;
}

export type Entry = UnknownEntry | MarkedEntry | KnownEntry;

class Database extends Dexie {
    vocabulary: Dexie.Table<Entry, [PackageID, string]>;
    constructor() {
        super('entries');
        this.version(1).stores({
            vocabulary: '[pkgId+key], [pkgId+state]'
        });
    }
}

let db = new Database();

export function clearEntries() {
    return db.vocabulary.clear();
}

export function putEntries(entries: Entry[]) {
    return new Promise((resolve) => {
        const CHUNK = 10000;
        function f(index: number) {
            if (index < entries.length) {
                let slice = entries.slice(index, index + CHUNK);
                db.vocabulary.bulkPut(slice).then(() => {
                    console.log(`${Math.min(index + CHUNK, entries.length)}/${entries.length} done.`);
                    f(index + CHUNK);
                });
            } else {
                resolve();
            }
        }
        f(0);
    });
}

export function lookUpEntries(pkgId: PackageID, keys: string[][]): Promise<Entry[]> {
    function lookup(resolve: any) {
        let results: (Entry | null)[] = [];
        function f(index: number) {
            if (index < keys.length) {
                let keyStr = keys[index].join(' ');
                db.vocabulary.where({ pkgId, key: keyStr }).first(res => {
                    results.push(res || null);
                    f(index + 1);
                }).catch(() => {
                    results.push(null);
                    f(index + 1);
                });
            } else {
                resolve(results);
            }
        }
        f(0);
    }
    return new Promise((resolve) => {
        lookup(resolve);
    });
}

export function updateEntry(entry: Entry) {
    return db.vocabulary.put(entry);
}

export function countEntries(pkgId: PackageID, state: State): Promise<number> {
    const c = db.vocabulary.where({ pkgId, state });
    return c.count();
}

export function listEntries(pkgId?: PackageID, state?: State): Promise<Entry[]> {
    let c;
    if (state === undefined) {
        c = db.vocabulary.where('state').equals(State.Known).or('state').equals(State.Marked);
    } else {
        c = db.vocabulary.where('state').equals(state);
    }
    if (pkgId) {
        c = c.and(entry => entry.pkgId === pkgId);
    }
    return c.toArray();
}

export function importEntries(pkgId: PackageID, data: string) {
    let keys = JSON.parse(data);
    let entries = [];
    for (let key of keys) {
        let entry: UnknownEntry = {
            pkgId,
            key,
            state: State.Unknown,
        };
        entries.push(entry);
    }
    return putEntries(entries);
}

export interface MarkedEntryFields {
    date: number;
    source: {
        url: string,
        title: string,
    };
    context: {
        begin: number,
        end: number,
        text: string,
    };
}

export async function importUserData(data: string) {
    let { known, marked } = JSON.parse(data);
    let entries: Entry[] = [];

    let packages = await getPackages();
    for (let pkgId in known) {
        if (pkgId in packages) {
            for (let key of known[pkgId]) {
                let entry: KnownEntry = {
                    pkgId,
                    key,
                    state: State.Known,
                };
                entries.push(entry);
            }
        }
    }
    for (let pkgId in marked) {
        if (pkgId in packages) {
            for (let obj of marked[pkgId]) {
                let entry: MarkedEntry = {
                    pkgId,
                    key: obj.key,
                    state: State.Marked,
                    date: obj.date,
                    context: obj.context,
                    source: obj.source,
                };
                entries.push(entry);
            }
        }
    }
    return putEntries(entries);
}

export async function exportUserData() {
    let entries = await listEntries();

    let known: { [pkgId: string]: string[] } = {};
    let marked: { [pkgId: string]: MarkedEntryFields[] } = {};
    for (let entry of entries) {
        if (entry.state === State.Known) {
            let key = entry.key;
            if (entry.pkgId in known) {
                known[entry.pkgId].push(key);
            } else {
                known[entry.pkgId] = [key];
            }
        } else if (entry.state === State.Marked) {
            let serializedEntry = {
                key: entry.key,
                date: entry.date,
                source: entry.source,
                context: entry.context,
            };
            if (entry.pkgId in marked) {
                marked[entry.pkgId].push(serializedEntry);
            } else {
                marked[entry.pkgId] = [serializedEntry];
            }
        }
    }

    let obj = { known, marked };
    return JSON.stringify(obj);
}
