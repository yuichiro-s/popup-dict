import 'chromereload/devonly';
import { Entry } from './entry';
import { Trie, addEntry } from './trie';

abstract class Dictionary {
  language: string;
  abstract search(query: string): Entry[];
}

let dict = new Trie();

function createEntry(rawEntry: any): { keys: string[], entry: Entry } {
  let keys = [];
  keys.push(rawEntry.form);
  for (let { _, form } of rawEntry.variants) {
    keys.push(form);
  }

  let entry = {
    lemma: rawEntry.form,
    pos: rawEntry.pos,
    features: rawEntry.attrs,
    definitions: rawEntry.defs,
    url: 'https://es.wiktionary.org/' + rawEntry.form,
  };

  return { keys, entry };
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
            let { keys, entry } = createEntry(rawEntry);
            for (let key of keys) {
              addEntry(dict, key, entry);
              formCount++;
            }
            lemmaCount++;
          } catch (e) {
            console.log('Failed to parse: ' + line);
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
