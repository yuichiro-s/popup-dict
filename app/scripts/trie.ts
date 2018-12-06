import { Language } from './languages';
import { lookUpEntries, Entry } from './entry';
import { CachedMap } from './cachedmap';

type TrieNode = {
  n: { [c: string]: TrieNode }; // NEXT
  e: boolean; // EXISTS
};

function isEnd(node: TrieNode) {
  return node.e;
}

export type Span = {
  begin: number,
  end: number,
  key: string[],
  entry: Entry,
};

export async function searchAllBatch(lang: string, lemmasBatch: string[][]) {
  let results = [];
  for (let lemmas of lemmasBatch) {
    results.push(await searchAll(lang, lemmas));
  }
  return results;
}

async function searchAll(lang: string, lemmas: string[]) {
  let trie = await tries.get(lang);
  let spans: Span[] = [];
  let keys = [];
  let start = 0;
  while (start < lemmas.length) {
    let node = trie;
    let cursor = start;
    let lastMatch = 0;
    while (cursor < lemmas.length) {
      const lemma = lemmas[cursor];
      if (!(lemma in node.n)) {
        break;
      }
      node = node.n[lemma];
      cursor++;
      if (isEnd(node)) {
        lastMatch = cursor;
      }
    }

    if (lastMatch > 0) {
      // Note that `text` is normalized
      // TODO: batch lookups
      const key = lemmas.slice(start, lastMatch);
      keys.push({ begin: start, end: lastMatch, key });
      start = lastMatch;
    } else {
      start++;
    }
  }
  let entries = await lookUpEntries(lang, keys.map((k) => k.key));
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let entry = entries[i];
    if (entry) {
      let span: Span = {
        begin: key.begin,
        end: key.end,
        key: key.key,
        entry,
      };
      spans.push(span);
    }
  }

  return spans;
}

export async function search(lang: string, key: string[]) {
  let trie = await tries.get(lang);
  const length = key.length;
  function dfs(node: TrieNode, i: number): boolean {
    if (i >= length) {
      return node.e;
    } else {
      const token = key[i];
      return dfs(node.n[token], i + 1);
    }
  }
  if (dfs(trie, 0)) {
    let entry = (await lookUpEntries(lang, [key]))[0];
    return entry;
  } else {
    return null;
  }
}

async function loadTrie(lang: Language) {
  let path = chrome.runtime.getURL(`data/${lang}/trie.json`);
  console.log('Loading trie for ' + lang + ' ...');
  let response = await fetch(path);
  let res = await response.text();
  let root = JSON.parse(res);
  console.log('Loaded.');
  return root;
}

let tries = new CachedMap<string, TrieNode>(loadTrie);
