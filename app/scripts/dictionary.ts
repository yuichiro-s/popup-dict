import 'chromereload/devonly';
import { Entry } from './entry';
import { Trie, addEntry } from './trie';

abstract class Dictionary {
  language: string;
  abstract search(query: string): Entry[];
}

let dict = new Trie();

export const LEMMA = '_LEMMA_';
export type VariantType = '_LEMMA_' | string[];
export type Variant = { type: VariantType, form: string };

function createEntry(rawEntry: any): { variants: Variant[], entry: Entry } {
  let [lemma, pos, features, variantArray, definitions] = rawEntry;

  let variants: Variant[] = [];
  variants.push({ type: LEMMA, form: lemma });
  for (let [type, form] of variantArray) {
    variants.push({ type, form });
  }

  let entry = {
    lemma,
    pos,
    features,
    definitions,
    url: 'https://en.wiktionary.org/wiki/' + lemma + '#Spanish',
  };

  return { variants, entry };
}

function loadDictionary() {
  let req = new XMLHttpRequest();
  let dictPath = chrome.runtime.getURL('data/dict.json');
  req.onreadystatechange = () => {
    if (req.readyState === 4 && req.status === 200) {
      let lemmaCount = 0;
      let formCount = 0;
      for (let line of req.responseText.split('\n')) {
        if (line.length > 0) {
          try {
            let rawEntry = JSON.parse(line);
            let { variants, entry } = createEntry(rawEntry);
            for (let variant of variants) {
              addEntry(dict, variant, entry);
              formCount++;
            }
            lemmaCount++;
          } catch (e) {
            console.log('Failed to parse: ' + line);
            console.log(e);
          }
        }
      }
      console.log(`${lemmaCount} entries (${formCount} wordforms) loaded.`);
      console.log(dict);
    }
  };
  req.open('GET', dictPath);
  req.send();
}

export function getDictionary() {
  return dict;
}

loadDictionary();
