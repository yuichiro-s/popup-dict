import 'chromereload/devonly';
import { Entry } from './entry';
import { Language } from './languages';

export type VariantType = string | string[];
export const LEMMA: VariantType = '_LEMMA_';
export type Variant = { type: VariantType, form: string };

type DictionaryWasm = typeof import('./trie_dictionary_binding');

export type Dictionary = {
  lang: Language,
  name: string,
  path: string,
  url: string,
  enabled: boolean,
  dict: null | DictionaryWasm,
};

let dictionaries: Dictionary[] = [
  {
    lang: Language.Spanish,
    name: 'es-en-wiktionary',
    path: 'data/spanish/enwiktionary.bin',
    url: 'https://en.wiktionary.org/wiki/{}#Spanish',
    enabled: true,
    dict: null,
  },
  {
    lang: Language.German,
    name: 'de-en-wiktionary',
    path: 'data/german/enwiktionary.bin',
    url: 'https://en.wiktionary.org/wiki/{}#German',
    enabled: true,
    dict: null,
  },
  {
    lang: Language.English,
    name: 'en-en-wiktionary',
    path: 'data/english/enwiktionary.bin',
    url: 'https://en.wiktionary.org/wiki/{}#English',
    enabled: true,
    dict: null,
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
  req.responseType = 'arraybuffer';
  req.onreadystatechange = async () => {
    if (req.readyState === 4 && req.status === 200) {
      let mod = await import('./trie_dictionary_binding');
      console.log('Loading WASM binding...');
      await mod.ready();
      console.log('Ready.');
      let DictionaryWasm = mod.Dictionary;
      let bytes = new Uint8Array(req.response);
      let d = DictionaryWasm.deserialize(bytes, true);
      dict.dict = d;
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
    if (dict.lang === lang && dict.enabled && !dict.dict) {
      // load an enabeld but not loaded dictionary
      console.log(`Loading ${dict.name} from ${dict.path} ...`);
      loadDictionaryFromFile(dict);
    }
  }
}

export function getDictionaries(): Dictionary[] {
  return dictionaries;
}
