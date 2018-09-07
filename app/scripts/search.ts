import { getDictionary, VariantType } from './dictionary';
import { search as searchTrie } from './trie';
import { renderEntry, Entry, VariantEntry } from './entry';
import { isWordBoundary } from './word';

function normalize(query: string): string {
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

function mergeResultsWithSameEntry(results: { length: number, variantEntry: VariantEntry }[]) {
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
      });
    }
  }
  return newResults;
}

export function search(query: string): SearchResults {
  console.log('Query:', query);

  let dict = getDictionary();

  let normalizedQuery = normalize(query);

  let results = searchTrie(dict, normalizedQuery);

  // filter out search results that don't end at an end-of-word
  results = results.filter(({ length }) => isWordBoundary(query, length));

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