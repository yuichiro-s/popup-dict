import Dexie, { IndexableType } from 'dexie';

import { Entry, State, UnknownEntry, KnownEntry, MarkedEntry } from '../common/entry';
import { PackageID } from '../common/package';
import { getPackages } from './packages';
import { exportStats, StatsHistoryEntry, importStats } from './stats';
import { getTrie } from './search';
import { getKeys } from './trie';

class Database extends Dexie {
    vocabulary: Dexie.Table<Entry, [PackageID, string]>;
    constructor() {
        super('entries');
        this.version(1).stores({
            vocabulary: '[pkgId+key], [pkgId+state], pkgId, state'
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

export function deleteEntries(pkgId: PackageID) {
    return db.vocabulary.where({ pkgId }).delete().then(() => {
        console.log(`Deleted ${pkgId} from entries.`);
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

export function updateEntries(entries: Entry[]) {
    return db.vocabulary.bulkPut(entries);
}

export function countEntries(pkgId: PackageID, state: State): Promise<number> {
    const c = db.vocabulary.where({ pkgId, state });
    return c.count();
}

export function listEntries(pkgId?: PackageID, state?: State): Promise<Entry[]> {
    let q: { [key: string]: IndexableType } = {};
    if (state) {
        q.state = state;
    }
    if (pkgId) {
        q.pkgId = pkgId;
    }
    return db.vocabulary.where(q).toArray();
}

// create entries from already imported trie
export async function importEntries(pkgId: PackageID) {
    let keys = getKeys(await getTrie(pkgId));
    let entries = [];
    for (let lemmas of keys) {
        const key = lemmas.join(' ');
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
    let { known, marked, stats } = JSON.parse(data);

    let entries: Entry[] = [];

    const cat = (tuple: [PackageID, string]) => {
        return tuple.join('@');
    };

    const keys = await db.vocabulary.toCollection().primaryKeys();
    let keySet = new Set(keys.map(cat));

    let packages = await getPackages();
    for (let pkgId in known) {
        if (pkgId in packages) {
            for (let key of known[pkgId]) {
                if (keySet.has(cat([pkgId, key]))) {
                    let entry: KnownEntry = {
                        pkgId,
                        key,
                        state: State.Known,
                    };
                    entries.push(entry);
                }
            }
        }
    }
    for (let pkgId in marked) {
        if (pkgId in packages) {
            for (let obj of marked[pkgId]) {
                if (keySet.has(cat([pkgId, obj.key]))) {
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
    }
    return Promise.all([putEntries(entries), importStats(stats)]);
}

export async function exportUserData() {
    let knownEntries = listEntries(undefined, State.Known) as Promise<KnownEntry[]>;
    let markedEntries = listEntries(undefined, State.Marked) as Promise<MarkedEntry[]>;

    let known: { [pkgId: string]: string[] } = {};
    for (let entry of await knownEntries) {
        let key = entry.key;
        if (entry.pkgId in known) {
            known[entry.pkgId].push(key);
        } else {
            known[entry.pkgId] = [key];
        }
    }

    let marked: { [pkgId: string]: MarkedEntryFields[] } = {};
    for (let entry of await markedEntries) {
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

    const stats: StatsHistoryEntry[] = await exportStats();

    let obj = { known, marked, stats };
    return JSON.stringify(obj);
}
