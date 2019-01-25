import { PackageID } from './packages';
import { CachedMap } from './cachedmap';
import { table } from './database';

type FrequencyTable = { [key: string]: number };

export function getFrequency(tokens: string[], lang: PackageID): Promise<number[] | null> {
    return new Promise(resolve => {
        frequencyTables.get(lang).then(table => {
            let frequencies = [];
            for (const token of tokens) {
                let frequency = table[token] || 0;
                frequencies.push(frequency);
            }
            resolve(frequencies);
        }).catch(() => {
            // frequency info is not found
            resolve(null);
        });
    });
}

let frequencyTable = table('frequencyTables');
let frequencyTables = new CachedMap<PackageID, FrequencyTable>(frequencyTable.loader);
let importFrequencyTable = frequencyTable.importer;
let deleteFrequencyTable = frequencyTable.deleter;
export { importFrequencyTable, deleteFrequencyTable };
