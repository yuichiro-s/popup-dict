import { PackageID } from './packages';
import { CachedMap } from './cachedmap';
import { table } from './database';

export type DictionaryItem = {
    word: string,
    defs?: string[][],
    lemmas?: string[],
};

type Dictionary = { [key: string]: DictionaryItem };
type Index = { [key: string]: number };

export async function lookUpDictionary(keys: string[], pkg: PackageID) {
    let index = await indexes.get(pkg);
    let results = [];
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let n = index[key];
        let item;
        if (n !== undefined) {
            let dictionaryKey = pkg + ',' + n;
            let dict = await dictionaries.get(dictionaryKey);
            item = dict[key];
        } else {
            item = null;
        }
        results.push(item);
    }
    return results;
}

let indexTable = table('indexes');
let dictionaryTable = table('dictionaries');
let indexes = new CachedMap<PackageID, Index>(indexTable.loader);
let dictionaries = new CachedMap<string, Dictionary>(dictionaryTable.loader);
let importIndex = indexTable.importer;
let importDictionary = dictionaryTable.importer;
export { importIndex, importDictionary };
