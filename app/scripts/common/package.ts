export type PackageID = string;

export type DictionaryInfo = {
    name: string;
    pattern: string;
};

export type ShowDictionary = 'always' | 'unknown-or-marked' | 'never';

export type Package = {
    id: PackageID;
    name: string;
    languageCode: string;
    tokenizeByWhiteSpace: boolean;
    dictionaries: DictionaryInfo[];
    showDictionary: ShowDictionary;
    template: string;
    blacklist: string[];
    default: Package;
};