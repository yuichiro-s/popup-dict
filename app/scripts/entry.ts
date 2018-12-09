import { Language } from './languages';
import Dexie from 'dexie';

export enum State {
  Unknown,
  Marked,
  Known,
}

export type Entry = {
  lang: Language,
  key: string,
  state: State,
  date?: number,
  source?: {
    url: string,
    title: string,
  },
  context?: {
    begin: number,
    end: number,
    text: string,
  },
};

class Database extends Dexie {
  vocabulary: Dexie.Table<Entry, [Language, string]>;
  constructor() {
    super('database');
    this.version(1).stores({
      vocabulary: '[lang+key], state'
    });
  }
}

let db = new Database();

export function clearEntries() {
  return db.vocabulary.clear();
}

export function putEntries(entries: Entry[]) {
  return new Promise((resolve) => {
    const CHUNK = 10000;
    function f(index: number) {
      if (index < entries.length) {
        let slice = entries.slice(index, index + CHUNK);
        db.vocabulary.bulkPut(slice).then(() => {
          console.log(`${Math.min(index + CHUNK, entries.length)}/${entries.length} done.`);
          f(index + CHUNK);
        });
      } else {
        resolve();
      }
    }
    f(0);
  });
}

export function lookUpEntries(lang: Language, keys: string[][]): Promise<Entry[]> {
  function lookup(resolve: any) {
    let results: (Entry | null)[] = [];
    function f(index: number) {
      if (index < keys.length) {
        let keyStr = keys[index].join(' ');
        db.vocabulary.where({ lang, key: keyStr }).first(res => {
          results.push(res || null);
          f(index + 1);
        }).catch(() => {
          results.push(null);
          f(index + 1);
        });
      } else {
        resolve(results);
      }
    }
    f(0);
  }
  return new Promise((resolve) => {
    lookup(resolve);
  });
}

export function updateEntry(entry: Entry) {
  return db.vocabulary.put(entry);
}

export function listEntries(lang?: Language, state?: State) {
  let c;
  if (state === undefined) {
    c = db.vocabulary.where('state').equals(State.Known).or('state').equals(State.Marked);
  } else {
    c = db.vocabulary.where('state').equals(state);
  }
  if (lang) {
    c = c.and(entry => entry.lang === lang);
  }
  return c.toArray();
}

export function importEntries(data: string) {
  let entries = JSON.parse(data);
  for (let entry of entries) {
    if (entry.state === undefined) {
      entry.state = State.Unknown;
    }
  }
  return putEntries(entries);
}

export async function exportEntries() {
  let entries = await listEntries();
  return JSON.stringify(entries);
}