import 'chromereload/devonly';

import { getDictionaries, LEMMA, Dictionary } from './dictionary';
import { search as searchTrie } from './trie';
import { renderEntry, VariantEntry } from './entry';
import { isWordBoundary } from './word';
import { getLanguage } from './language';

interface EntryWithLength {
  variantEntry: VariantEntry;
  length: number;
}

function sortResults(results: EntryWithLength[]) {
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
}

function mergeResultsWithSameEntry(results: {variantEntry: VariantEntry, length: number, dict: Dictionary}[]) {
  let newResults = [];
  for (let item of results) {
    let isNew = true;
    for (let item2 of newResults) {
      if (item.variantEntry.entry === item2.entry && item.length === item2.length) {
        // keep only variants with maximum matching length
        // since results are sorted by length in descending order, item2.length >= item.length
        item2.types.push(item.variantEntry.type);
        isNew = false;
        break;
      }
    }
    if (isNew) {
      newResults.push({
        length: item.length,
        types: [item.variantEntry.type],
        entry: item.variantEntry.entry,
        dict: item.dict,
      });
    }
  }
  return newResults;
}

function normalizeQuery(query: string): string {
  return query.toLowerCase();
}

export class PopupEntry {
  rendered: string;
  url: string;
}

export class SearchResults {
  entries: PopupEntry[];
  matchLength: number;
}

export function search(query: string): SearchResults {
  console.log('Query:', query);

  let normalizedQuery = normalizeQuery(query);

  // search through all working dictionaries
  let currentLanguage = getLanguage();
  let results = [];
  for (let dict of getDictionaries()) {
    if (dict.enabled && dict.lang === currentLanguage && dict.trie) {
      let dictResults = searchTrie(dict.trie, normalizedQuery);

      // filter out search results that don't end at a word boundary
      dictResults = dictResults.filter(({ length }) => isWordBoundary(query, length));

      // add reference to original dictionary
      let items = dictResults.map((item: EntryWithLength) => {
        return {
          length: item.length,
          variantEntry: item.variantEntry,
          dict,
        };
      });

      results.push(...items);
    }
  }
  sortResults(results);

  // merge duplicate variants
  let newResults = mergeResultsWithSameEntry(results);

  console.log('Results:', newResults);

  // get max matching length
  let matchLength = 0;
  if (newResults.length > 0) {
    matchLength = newResults[0].length;
  }

  // render entries
  let entries = [];
  for (let item of newResults) {
    let renderedEntry = renderEntry(item.entry, item.types);
    entries.push({ rendered: renderedEntry, url: item.entry.url });
  }

  return { entries, matchLength };
}