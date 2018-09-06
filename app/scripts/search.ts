import { getDictionary } from './dictionary';
import { search as searchTrie } from './trie';
import { renderEntry } from './entry';
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

export function search(query: string): SearchResults {
  console.log('Query:', query);

  let dict = getDictionary();

  let normalizedQuery = normalize(query);

  let results = searchTrie(dict, normalizedQuery);

  // filter out search results that don't end at an end-of-word
  results = results.filter(({ length }) => isWordBoundary(query, length));

  console.log('Results:', results);

  // get max matching length
  let matchLength = 0;
  if (results.length > 0) {
    matchLength = results[0].length;
  }

  // rendered entries
  let entries = [];
  for (let item of results) {
    let renderedEntry = renderEntry(item.entry);
    entries.push({ rendered: renderedEntry, url: item.entry.url });
  }

  return { entries, matchLength };
}