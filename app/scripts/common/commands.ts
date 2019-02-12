import { Entry, State } from "./entry";
import { IGlobalSettings } from "./global-settings";
import { IPackage, PackageID } from "./package";

export type Command =
    { type: "is-enabled" } |

    // global settings
    { type: "get-global-settings" } |
    { type: "set-global-settings", globalSettings: IGlobalSettings } |

    // dictionary
    { type: "lookup-dictionary", keys: string[], pkgId: PackageID } |
    { type: "get-frequency", keys: string[], pkgId: PackageID } |

    { type: "get-tab" } |

    // search
    { type: "search", pkgId: PackageID, key: string[] } |
    { type: "search-all-batch", pkgId: PackageID, tokensBatch: string[][] } |

    // entry info
    { type: "update-entry", entry: Entry } |
    { type: "update-entries", entries: Entry[] } |
    { type: "clear-entries" } |
    { type: "list-entries", pkgId?: PackageID, state?: State } |
    { type: "import-user-data", dataURL: string } |
    { type: "export-user-data" } |

    // stats
    { type: "get-stats", pkgId: PackageID } |
    { type: "get-stats-history", pkgId: PackageID } |

    { type: "get-packages" } |
    { type: "get-package", pkgId: PackageID } |
    { type: "set-last-package", pkgId: PackageID } |
    { type: "get-last-package-id" } |
    { type: "update-package", pkg: IPackage } |
    { type: "delete-package", pkgId: PackageID } |

    // misc
    { type: "guess-package", text: string };

export type ContentCommand =
    { type: "enable" } |
    { type: "disable" } |
    { type: "toggle-marked" } |
    { type: "toggle-known" } |
    { type: "set-package-id", pkgId: PackageID };
