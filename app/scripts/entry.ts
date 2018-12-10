import { PackageID } from './packages';
import Dexie from 'dexie';

export enum State {
    Unknown,
    Marked,
    Known,
}

export type Entry = {
    pkgId: PackageID,
    key: string,
    state: State,
    date?: number,
    source?: {
        url: string,
        title: string,
    },
    context?: {
        begin: number,
        end: number,
        text: string,
    },
};

class Database extends Dexie {
    vocabulary: Dexie.Table<Entry, [PackageID, string]>;
    constructor() {
        super('entries');
        this.version(1).stores({
            vocabulary: '[pkgId+key], state'
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

export function listEntries(pkgId?: PackageID, state?: State) {
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
        let entry = {
            pkgId,
            key,
            state: State.Unknown,
        };
        entries.push(entry);
    }
    return putEntries(entries);
}

export function importUserData(data: string) {
    // TODO: implement this
    let entries = JSON.parse(data);
    for (let entry of entries) {
        if (entry.state === undefined) {
            entry.state = State.Unknown;
        }
    }
    return putEntries(entries);
}

export async function exportUserData() {
    // TODO: implement this
    let entries = await listEntries();
    return JSON.stringify(entries);
}