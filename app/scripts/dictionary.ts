import { Language } from './languages';
import { CachedMap } from './cachedmap';
import { makeLoader } from './database';

export type DictionaryItem = {
    word: string,
    freq: number,
    defs?: string[][],
    lemmas?: string[],
};

export async function lookUpDictionary(keys: string[], lang: Language) {
    let index = await indexes.get(lang);
    let results = [];
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let n = index[key];
        let item;
        if (n !== null) {
            let dictionaryKey = lang + ',' + n;
            let dict = await dictionaries.get(dictionaryKey);
            item = dict[key];
        } else {
            item = null;
        }
        results.push(item);
    }
    return results;
}

type Dictionary = { [key: string]: DictionaryItem };
type Index = { [key: string]: number };

let indexes = new CachedMap<Language, Index>(makeLoader('indexes'));
let dictionaries = new CachedMap<string, Dictionary>(makeLoader('dictionaries'));
