import Dexie, { IndexableType } from "dexie";

import { Entry, IKnownEntry, IMarkedEntry, IUnknownEntry, State } from "../common/entry";
import { PackageID } from "../common/package";
import { loadJSON } from "../preprocess/loader-browser";
import { getPackages } from "./packages";
import { getTrie } from "./search";
import { exportStats, importStats, IStatsHistoryEntry } from "./stats";
import { getKeys } from "./trie";

class Database extends Dexie {
    public vocabulary: Dexie.Table<Entry, [PackageID, string]>;
    constructor() {
        super("entries");
        this.version(1).stores({
            vocabulary: "[pkgId+key], [pkgId+state], pkgId, state",
        });
    }
}

const db = new Database();

export function clearEntries() {
    return db.vocabulary.clear();
}

export function putEntries(entries: Entry[]) {
    return new Promise((resolve) => {
        const CHUNK = 10000;
        function f(index: number) {
            if (index < entries.length) {
                const slice = entries.slice(index, index + CHUNK);
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
        const results: Array<Entry | null> = [];
        function f(index: number) {
            if (index < keys.length) {
                const keyStr = keys[index].join(" ");
                db.vocabulary.where({ pkgId, key: keyStr }).first((res) => {
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
    const q: { [key: string]: IndexableType } = {};
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
    const keys = getKeys(await getTrie(pkgId));
    const entries = [];
    for (const lemmas of keys) {
        const key = lemmas.join(" ");
        const entry: IUnknownEntry = {
            pkgId,
            key,
            state: State.Unknown,
        };
        entries.push(entry);
    }
    return putEntries(entries);
}

export interface IMarkedEntryFields {
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

export async function importUserData(dataURL: string) {
    try {
        const { known, marked, stats } = await loadJSON(dataURL);
        const entries: Entry[] = [];

        const cat = (tuple: [PackageID, string]) => {
            return tuple.join("@");
        };

        const keys = await db.vocabulary.toCollection().primaryKeys();
        const keySet = new Set(keys.map(cat));

        const packages = await getPackages();
        for (const pkgId in known) {
            if (pkgId in packages) {
                for (const key of known[pkgId]) {
                    if (keySet.has(cat([pkgId, key]))) {
                        const entry: IKnownEntry = {
                            pkgId,
                            key,
                            state: State.Known,
                        };
                        entries.push(entry);
                    }
                }
            }
        }
        for (const pkgId in marked) {
            if (pkgId in packages) {
                for (const obj of marked[pkgId]) {
                    if (keySet.has(cat([pkgId, obj.key]))) {
                        const entry: IMarkedEntry = {
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
        return Promise.all([putEntries(entries), importStats(stats)]).then(() => {
            return `Imported ${entries.length} entries`;
        });
    } catch (e) {
        throw new Error("Unable to recognize file format");
    }
}

export async function exportUserData() {
    const knownEntries = listEntries(undefined, State.Known) as Promise<IKnownEntry[]>;
    const markedEntries = listEntries(undefined, State.Marked) as Promise<IMarkedEntry[]>;

    const known: { [pkgId: string]: string[] } = {};
    for (const entry of await knownEntries) {
        const key = entry.key;
        if (entry.pkgId in known) {
            known[entry.pkgId].push(key);
        } else {
            known[entry.pkgId] = [key];
        }
    }

    const marked: { [pkgId: string]: IMarkedEntryFields[] } = {};
    for (const entry of await markedEntries) {
        const serializedEntry = {
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

    const stats: IStatsHistoryEntry[] = await exportStats();

    const obj = { known, marked, stats };

    const json = JSON.stringify(obj);
    const blob = new Blob([json], { type: "text/json" });
    const url = window.URL.createObjectURL(blob);

    return url;
}
