import 'chromereload/devonly';
import { Entry } from './entry';

class Node {
  next: { [c: string]: Node; };
  entries: Entry[];

  constructor() {
    this.next = {};
    this.entries = [];
  }
}

function codePointAt(str: string, i: number): number {
  const p = str.codePointAt(i);
  if (p === undefined) {
    throw new Error('codePointAt() returned undefined.');
  }
  return p;
}

export function addEntry(root: Node, key: string, entry: Entry) {
  let node = root;
  for (let i = 0; i < key.length; i++) {
    const p = codePointAt(key, i);
    if (!(p in node.next)) node.next[p] = new Node();
    node = node.next[p];
    if (i === key.length - 1) {
      node.entries.push(entry);
    }
  }
}

export function search(root: Node, query: string) {
  type EntryWithLength = { length: number, entry: Entry };
  let results: EntryWithLength[] = [];
  let node = root;
  for (let i = 0; i < query.length; i++) {
    const p = codePointAt(query, i);
    if (!(p in node.next)) {
      // no matching next node found
      break;
    } else {
      node = node.next[p];
      for (let entry of node.entries) {
        let match = query.substring(0, i + 1);
        let length = match.length;
        results.push({ length, entry });
      }
    }
  }

  // sort by length in descending order
  results.sort((a, b) => { return b.length - a.length; });

  // remove duplicates
  let newResults: EntryWithLength[] = [];
  for (let item of results) {
    let used = false;
    for (let item2 of newResults) {
      if (item.entry === item2.entry) {
        used = true;
        break;
      }
    }
    if (!used) {
      newResults.push(item);
    }
  }

  return newResults;
}

export { Node as Trie };