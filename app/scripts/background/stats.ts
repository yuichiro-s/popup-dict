import Dexie from "dexie";

import { State } from "../common/entry";
import { keys } from "../common/objectmap";
import { PackageID } from "../common/package";
import { countEntries } from "./entry";
import { getPackages } from "./packages";

interface IStats {
    knownCount: number;
    markedCount: number;
}

export interface IStatsHistoryEntry extends IStats {
    pkgId: PackageID;
    date: number;
}

class Database extends Dexie {
    public history: Dexie.Table<IStatsHistoryEntry, [PackageID, number]>;
    constructor() {
        super("stats-history");
        this.version(1).stores({
            history: "[pkgId+date], pkgId",
        });
    }
}
const db = new Database();

export async function getStats(pkgId: PackageID): Promise<IStats> {
    const knownCount = await countEntries(pkgId, State.Known);
    const markedCount = await countEntries(pkgId, State.Marked);
    return { knownCount, markedCount };
}

export function deleteStats(pkgId: PackageID) {
    return db.history.where("pkgId").equals(pkgId).delete();
}

export async function getStatsHistory(pkgId: PackageID): Promise<IStatsHistoryEntry[]> {
    return db.history.where("pkgId").equals(pkgId).toArray();
}

export async function saveStats() {
    const packages = await getPackages();
    const date = Date.now();
    for (const pkgId of keys(packages)) {
        const stats = await getStats(pkgId);
        const entry: IStatsHistoryEntry = {
            pkgId,
            date,
            knownCount: stats.knownCount,
            markedCount: stats.markedCount,
        };
        db.history.put(entry);
    }
}

export async function importStats(items: IStatsHistoryEntry[]) {
    db.history.bulkPut(items).then(() => {
        console.log(`Imported ${items.length} stats history items.`);
    });
}

export function exportStats() {
    return db.history.toArray();
}
