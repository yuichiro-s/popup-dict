import { CachedMap } from "../common/cachedmap";
import { IDictionary, IIndex } from "../common/dictionary";
import { get } from "../common/objectmap";
import { PackageID } from "../common/package";
import { getTable } from "./database";

export async function lookUpDictionary(keys: string[], pkgId: PackageID) {
    const index = await indexes.get(pkgId);
    const results = [];
    for (const key of keys) {
        const n = get(index, key);
        let item;
        if (n !== undefined) {
            const dictionaryKey = pkgId + "," + n;
            const dict = await dictionaries.get(dictionaryKey);
            item = get(dict, key);
        } else {
            item = null;
        }
        results.push(item);
    }
    return results;
}

export async function deleteAllDictionaries(pkgId: PackageID) {
    for (const key of await dictionaryTable.table.toCollection().keys()) {
        if (typeof key === "string") {
            if (key.toString().split(",")[0] === pkgId) {
                await dictionaryTable.deleter(key);
            }
        }
    }
}

const indexTable = getTable<PackageID, IIndex>("indexes");
const dictionaryTable = getTable<string, IDictionary>("dictionaries");
const indexes = new CachedMap<PackageID, IIndex>(indexTable.loader);
const dictionaries = new CachedMap<string, IDictionary>(dictionaryTable.loader);
const importIndex = indexTable.importer;
const deleteIndex = indexTable.deleter;
const importDictionary = dictionaryTable.importer;
export { importIndex, deleteIndex, importDictionary };
