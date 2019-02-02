import { State, Entry } from './entry';
import { Package, PackageID } from './package';

export type Command =
    { type: 'is-enabled' } |

    { type: 'lemmatize', tokens: string[], pkgId: PackageID } |

    // dictionary
    { type: 'lookup-dictionary', keys: string[], pkgId: PackageID } |
    { type: 'get-frequency', keys: string[], pkgId: PackageID } |

    { type: 'get-tab' } |

    // search
    { type: 'search', pkgId: PackageID, key: string[] } |
    { type: 'search-all-batch', pkgId: PackageID, lemmasBatch: string[][] } |

    // entry info
    { type: 'update-entry', entry: Entry } |
    { type: 'update-entries', entries: Entry[] } |
    { type: 'clear-entries' } |
    { type: 'list-entries', pkgId?: PackageID, state?: State } |
    { type: 'import-user-data', data: string } |
    { type: 'export-user-data' } |

    // stats
    { type: 'get-stats', pkgId: PackageID } |
    { type: 'get-stats-history', pkgId: PackageID } |

    // package import
    { type: 'import-index', pkgId: PackageID, data: string } |
    { type: 'import-dictionary', pkgId: PackageID, n: number, data: string } |
    { type: 'import-lemmatizer', pkgId: PackageID, data: string } |
    { type: 'import-trie', pkgId: PackageID, data: string } |
    { type: 'import-entries', pkgId: PackageID } |
    { type: 'import-frequency', pkgId: PackageID, data: string } |

    { type: 'get-packages' } |
    { type: 'get-package', pkgId: PackageID } |
    { type: 'set-last-package', pkgId: PackageID } |
    { type: 'get-last-package-id' } |
    { type: 'update-package', pkg: Package } |
    { type: 'delete-package', pkgId: PackageID };

export type ContentCommand =
    { type: 'enable' } |
    { type: 'disable' } |
    { type: 'toggle-marked' } |
    { type: 'toggle-known' } |
    { type: 'set-package-id', pkgId: PackageID };
