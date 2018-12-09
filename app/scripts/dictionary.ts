import { Language } from './languages';
import { CachedMap } from './cachedmap';

import Dexie from 'dexie';

export type DictionaryItem = {
  word: string,
  freq: number,
  defs?: string[][],
  lemmas?: string[],
};

type Dictionary = { [key: string]: DictionaryItem };
type Index = { [key: string]: number };

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

interface DictionaryDatabaseEntry {
  lang: Language;
  n: number;
  dictionary: Dictionary;
}

interface IndexDatabaseEntry {
  lang: Language;
  index: Index;
}

class Database extends Dexie {
  dictionaries: Dexie.Table<DictionaryDatabaseEntry, [Language, number]>;
  indexes: Dexie.Table<IndexDatabaseEntry, Language>;
  constructor() {
    super('dictionaries');
    this.version(1).stores({
      dictionaries: '[lang+n]',
      indexes: 'lang',
    });
  }
}
let db = new Database();

function loadIndexes(lang: Language) {
  return new Promise((resolve, reject) => {
    console.log('Loading index for ' + lang + ' ...');
    db.indexes.get(lang).then(result => {
      if (result === undefined) {
        //reject(`Indexes for ${lang} not found.`);
        let path = chrome.runtime.getURL(`data/${lang}/dictionary/index`);
        fetch(path).then(response => {
          response.text().then(res => {
            let index = JSON.parse(res)!;
            db.indexes.put({ lang, index }).then(() => {
              console.log(`Loaded index from file for ${lang}.`);
              resolve(index);
            });
          });
        });
      } else {
        console.log(`Loaded index for ${lang}.`);
        resolve(result.index);
      }
    }).catch(reject);
  });
}

function loadDictionary(key: string) {
  let es = key.split(',');
  let lang = es[0];
  let n = Number.parseInt(es[1]);
  return new Promise((resolve, reject) => {
    console.log(`Loading dictionary for ${lang} (chunk=${n}) ...`);
    db.dictionaries.get([lang, n]).then(result => {
      if (result === undefined) {
        //reject(`Dictionary for ${lang} not found.`);
        let path = chrome.runtime.getURL(`data/${lang}/dictionary/entries${n}`);
        fetch(path).then(response => {
          response.text().then(res => {
            let dictionary = JSON.parse(res)!;
            db.dictionaries.put({ lang, n, dictionary }).then(() => {
              console.log(`Loaded dictionary from file for ${lang}.`);
              resolve(dictionary);
            });
          });
        });
      } else {
        console.log(`Loaded dictionary for ${lang}.`);
        resolve(result.dictionary);
      }
    }).catch(reject);
  });
}

let indexes = new CachedMap<Language, Index>(loadIndexes);
let dictionaries = new CachedMap<string, Dictionary>(loadDictionary);