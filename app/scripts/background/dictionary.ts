import { PackageID } from '../common/package';
import { CachedMap } from '../common/cachedmap';
import { get } from '../common/objectmap';
import { table } from './database';
import { Index, Dictionary } from '../common/dictionary';

export async function lookUpDictionary(keys: string[], pkg: PackageID) {
    let index = await indexes.get(pkg);
    let results = [];
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let n = get(index, key);
        let item;
        if (n !== undefined) {
            let dictionaryKey = pkg + ',' + n;
            let dict = await dictionaries.get(dictionaryKey);
            item = get(dict, key);
        } else {
            item = null;
        }
        results.push(item);
    }
    return results;
}

export async function deleteAllDictionaries(pkg: PackageID) {
    for (const key of await dictionaryTable.table.toCollection().keys()) {
        if (key.toString().split(',')[0] === pkg) {
            await dictionaryTable.deleter(key);
        }
    }
}

let indexTable = table('indexes');
let dictionaryTable = table('dictionaries');
let indexes = new CachedMap<PackageID, Index>(indexTable.loader);
let dictionaries = new CachedMap<string, Dictionary>(dictionaryTable.loader);
let importIndex = indexTable.importer;
let deleteIndex = indexTable.deleter;
let importDictionary = dictionaryTable.importer;
export { importIndex, deleteIndex, importDictionary };
