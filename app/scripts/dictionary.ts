import 'chromereload/devonly';
import { Entry } from './entry';
import { Trie, addEntry } from './trie';
import { Language } from './languages';

export const LEMMA = '_LEMMA_';
export type VariantType = '_LEMMA_' | string[];
export type Variant = { type: VariantType, form: string };


export type Dictionary = {
  lang: Language,
  name: string,
  path: string,
  url: string,
  enabled: boolean,
  trie: Trie | null,
};

let dictionaries: Dictionary[] = [
  {
    lang: Language.Spanish,
    name: 'es-en-wiktionary',
    path: 'data/spanish/enwiktionary.json',
    url: 'https://en.wiktionary.org/wiki/{}#Spanish',
    enabled: true,
    trie: null,
  },
  {
    lang: Language.German,
    name: 'de-en-wiktionary',
    path: 'data/german/enwiktionary.json',
    url: 'https://en.wiktionary.org/wiki/{}#German',
    enabled: true,
    trie: null,
  },
  {
    lang: Language.English,
    name: 'en-en-wiktionary',
    path: 'data/english/enwiktionary.json',
    url: 'https://en.wiktionary.org/wiki/{}#English',
    enabled: true,
    trie: null,
  },
];

/**
 * Parse a JSON line and create a dictionary entry.
 * @param line line to parse
 * @param url template string of URL of original dictionary page
 */
function parseEntry(line: string, url: string): { variants: Variant[], entry: Entry } {
  let [lemma, pos, features, variantArray, definitions] = JSON.parse(line);

  let variants: Variant[] = [];
  variants.push({ type: LEMMA, form: lemma });
  for (let [type, form] of variantArray) {
    variants.push({ type, form });
  }

  return {
    variants,
    entry: {
      lemma,
      pos,
      features,
      definitions,
      url: url.replace('{}', lemma),
    }
  };
}

function loadDictionaryFromFile(dict: Dictionary) {
  let req = new XMLHttpRequest();
  let dictPath = chrome.runtime.getURL(dict.path);
  req.onreadystatechange = () => {
    if (req.readyState === 4 && req.status === 200) {
      let lemmaCount = 0;
      let formCount = 0;
      let trie = new Trie();
      for (let line of req.responseText.split('\n')) {
        if (line.length > 0) {
          try {
            let { variants, entry } = parseEntry(line, dict.url);
            for (let variant of variants) {
              addEntry(trie, variant, entry);
              formCount++;
            }
            lemmaCount++;
            if (lemmaCount % 10000 === 0) {
              console.log(`${lemmaCount} lemmas loaded.`);
            }
          } catch (e) {
            console.log('Failed to parse: ' + line);
            console.log(e);
          }
        }
      }
      console.log(`${lemmaCount} entries (${formCount} wordforms) loaded.`);

      dict.trie = trie;
    }
  };
  req.open('GET', dictPath);
  req.send();
}

/**
 * Load dictionaries for the specified language.
 */
export function loadDictionaries(lang: Language) {
  for (let dict of dictionaries) {
    if (dict.lang === lang && dict.enabled && !dict.trie) {
      // load an enabeld but not loaded dictionary
      console.log(`Loading ${dict.name} from ${dict.path} ...`);
      loadDictionaryFromFile(dict);
    }
  }
}

export function getDictionaries(): Dictionary[] {
  return dictionaries;
}