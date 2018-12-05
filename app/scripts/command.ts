import { Language } from './languages';
import { State, Entry } from './entry';

export type Command =
  { type: 'is-enabled' } |

  { type: 'lemmatize', tokens: string[], lang: Language } |
  { type: 'lookup-dictionary', keys: string[], lang: Language } |
  { type: 'get-tab' } |

  { type: 'search', lang: Language, key: string[] } |
  { type: 'search-all-batch', lang: Language, lemmasBatch: string[][], lookUpDictionary: boolean } |

  { type: 'update-entry', entry: Entry } |
  { type: 'clear-entries' } |
  { type: 'list-entries', lang?: Language, state?: State } |
  { type: 'import-entries', data: string } |
  { type: 'export-entries' };

export function sendCommand(command: Command): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(command, (result) => resolve(result));
  });
}

export type ContentCommand =
  { type: 'enable' } |
  { type: 'disable' } |
  { type: 'toggle-marked' } |
  { type: 'toggle-known' } |
  { type: 'set-language', lang: Language };

export function sendContentCommand(command: ContentCommand, tabId: number): Promise<any> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, command, resolve);
  });
}