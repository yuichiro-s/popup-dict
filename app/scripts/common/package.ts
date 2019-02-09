export type PackageID = string;

export interface IDictionaryInfo {
    name: string;
    pattern: string;
}

export type ShowDictionary = "always" | "unknown-or-marked" | "never";

export interface IPackage {
    id: PackageID;
    name: string;
    languageCode: string;
    tokenizeByWhiteSpace: boolean;
    dictionaries: IDictionaryInfo[];
    showDictionary: ShowDictionary;
    template: string;
    blacklist: string[];
    default: ISettings;
}

export interface ISettings {
    id: PackageID;
    name: string;
    languageCode: string;
    tokenizeByWhiteSpace: boolean;
    dictionaries: IDictionaryInfo[];
    showDictionary: ShowDictionary;
    template: string;
}

export function createPackage(settings: ISettings): IPackage {
    return {
        id: settings.id,
        name: settings.name,
        languageCode: settings.languageCode,
        tokenizeByWhiteSpace: settings.tokenizeByWhiteSpace,
        dictionaries: settings.dictionaries || [],
        showDictionary: settings.showDictionary || "unknown-or-marked",
        template: settings.template,
        blacklist: [],
        default: settings,
    };
}
