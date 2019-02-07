import { PackageID } from '../common/package';
import { CachedMap } from '../common/cachedmap';
import { get } from '../common/objectmap';
import { table } from './database';
import { FrequencyTable } from '../common/frequency';

export function getFrequency(tokens: string[], lang: PackageID): Promise<number[] | null> {
    return new Promise(resolve => {
        frequencyTables.get(lang).then(table => {
            let frequencies = [];
            for (const token of tokens) {
                let frequency = get(table, token) || 0;
                frequencies.push(frequency);
            }
            resolve(frequencies);
        }).catch(() => {
            // frequency info is not found
            resolve(null);
        });
    });
}

let frequencyTable = table('frequency-tables');
let frequencyTables = new CachedMap<PackageID, FrequencyTable>(frequencyTable.loader);
let importFrequencyTable = frequencyTable.importer;
let deleteFrequencyTable = frequencyTable.deleter;
export { importFrequencyTable, deleteFrequencyTable };
