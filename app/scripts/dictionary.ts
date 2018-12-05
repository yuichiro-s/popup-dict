import { Language } from './languages';
import { CachedMap } from './cachedmap';

export type DictionaryItem = {
  word: string,
  freq: number,
  defs?: string[][],
  lemmas?: string[],
};

async function loadDictionary(lang: Language) {
  let path = chrome.runtime.getURL(`data/${lang}/dictionary.json`);
  console.log('Loading dictionary for ' + lang + ' ...');
  let response = await fetch(path);
  let res = await response.text();
  let obj = JSON.parse(res);
  console.log(`Loaded dictionary for ${lang}.`);
  return obj;
}

let dictionaries = new CachedMap<string, any>(loadDictionary);

export async function lookUpDictionary(keys: string[], lang: Language) {
  let dict = await dictionaries.get(lang);
  return keys.map(key => dict[key] || null);
}
