import { PackageID } from './packages';
import { State, Entry } from './entry';
import { Settings } from './settings';

export type Command =
    { type: 'is-enabled' } |

    { type: 'lemmatize', tokens: string[], pkgId: PackageID } |
    { type: 'lookup-dictionary', keys: string[], pkgId: PackageID } |

    { type: 'get-tab' } |

    // search
    { type: 'search', pkgId: PackageID, key: string[] } |
    { type: 'search-all-batch', pkgId: PackageID, lemmasBatch: string[][] } |

    // entries
    { type: 'update-entry', entry: Entry } |
    { type: 'clear-entries' } |
    { type: 'list-entries', pkgId?: PackageID, state?: State } |
    { type: 'import-user-data', data: string } |
    { type: 'export-user-data' } |

    // package import
    { type: 'import-index', pkgId: PackageID, data: string } |
    { type: 'import-dictionary', pkgId: PackageID, n: number, data: string } |
    { type: 'import-lemmatizer', pkgId: PackageID, data: string } |
    { type: 'import-trie', pkgId: PackageID, data: string } |
    { type: 'import-entries', pkgId: PackageID, data: string } |
    { type: 'add-package', settings: Settings } |

    { type: 'get-packages' } |
    { type: 'get-package' , pkgId: PackageID };

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
    { type: 'set-package-id', pkgId: PackageID };

export function sendContentCommand(command: ContentCommand, tabId: number): Promise<any> {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, command, resolve);
    });
}