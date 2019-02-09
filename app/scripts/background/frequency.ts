import { CachedMap } from "../common/cachedmap";
import { IFrequencyTable } from "../common/frequency";
import { get } from "../common/objectmap";
import { PackageID } from "../common/package";
import { getTable } from "./database";

export function getFrequency(tokens: string[], lang: PackageID): Promise<number[] | null> {
    return new Promise((resolve) => {
        frequencyTables.get(lang).then((table) => {
            const frequencies = [];
            for (const token of tokens) {
                const frequency = get(table, token) || 0;
                frequencies.push(frequency);
            }
            resolve(frequencies);
        }).catch(() => {
            // frequency info is not found
            resolve(null);
        });
    });
}

const frequencyTable = getTable<PackageID, IFrequencyTable>("frequency-tables");
const frequencyTables = new CachedMap<PackageID, IFrequencyTable>(frequencyTable.loader);
const importFrequencyTable = frequencyTable.importer;
const deleteFrequencyTable = frequencyTable.deleter;
export { importFrequencyTable, deleteFrequencyTable };
