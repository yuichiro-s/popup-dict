import Dexie from 'dexie';

import { table } from './database';
import { PackageID, getPackages } from './packages';
import { State, countEntries } from './entry';


interface Stats {
    knownCount: number;
    markedCount: number;
}

interface StatsHistoryEntry extends Stats {
    pkgId: PackageID;
    date: number;
}

class Database extends Dexie {
    history: Dexie.Table<StatsHistoryEntry, [PackageID, number]>;
    constructor() {
        super('stats-history');
        this.version(1).stores({
            history: '[pkgId+date], pkgId'
        });
    }
}
let db = new Database();

export async function getStats(pkgId: PackageID): Promise<Stats> {
    let knownCount = await countEntries(pkgId, State.Known);
    let markedCount = await countEntries(pkgId, State.Marked);
    return { knownCount, markedCount };
}

export async function getStatsHistory(pkgId: PackageID): Promise<StatsHistoryEntry[]> {
    return db.history.where('pkgId').equals(pkgId).toArray();
}

export async function saveAllStats() {
    const packages = await getPackages();
    const date = Date.now();
    for (const pkgId in packages) {
        const stats = await getStats(pkgId);
        const entry: StatsHistoryEntry = {
            pkgId,
            date,
            knownCount: stats.knownCount,
            markedCount: stats.markedCount,
        };
        db.history.put(entry);
    }
}