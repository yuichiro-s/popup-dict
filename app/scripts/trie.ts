import 'chromereload/devonly';
import { Entry, VariantEntry } from './entry';
import { Variant, VariantType, LEMMA } from './dictionary';

class Node {
  next: { [c: string]: Node; };
  entries: VariantEntry[];

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

export function addEntry(root: Node, variant: Variant, entry: Entry) {
  let node = root;
  let type = variant.type;
  let form = variant.form;
  for (let i = 0; i < form.length; i++) {
    const p = codePointAt(form, i);
    if (!(p in node.next)) node.next[p] = new Node();
    node = node.next[p];
    if (i === form.length - 1) {
      node.entries.push({ entry, type });
    }
  }
}

export function search(root: Node, query: string) {
  type EntryWithLength = { length: number, variantEntry: VariantEntry };
  let results: EntryWithLength[] = [];
  let node = root;
  for (let i = 0; i < query.length; i++) {
    const p = codePointAt(query, i);
    if (!(p in node.next)) {
      // no matching next node found
      break;
    } else {
      node = node.next[p];
      for (let variantEntry of node.entries) {
        let match = query.substring(0, i + 1);
        let length = match.length;
        results.push({ length, variantEntry });
      }
    }
  }

  // sorting criteria
  // 1. sort by length in descending order
  // 2. lemma match comes first
  let isExactMatch = (item: EntryWithLength): number => +(item.variantEntry.type === LEMMA);
  let sortingCriteria = [
    (item: EntryWithLength) => item.length,
    isExactMatch,
  ];
  results.sort((a, b) => {
    for (let c of sortingCriteria) {
      let v = c(b) - c(a);
      if (v !== 0) return v;
    }
    return 0;
  });

  return results;
}

export { Node as Trie };