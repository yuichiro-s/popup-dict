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
    default: Settings;
};

export type Settings = {
    id: PackageID;
    name: string;
    languageCode: string;
    tokenizeByWhiteSpace: boolean;
    dictionaries: DictionaryInfo[];
    showDictionary: ShowDictionary;
    template: string;
};

export function createPackage(settings: Settings): Package {
    return {
        id: settings.id,
        name: settings.name,
        languageCode: settings.languageCode,
        tokenizeByWhiteSpace: settings.tokenizeByWhiteSpace,
        dictionaries: settings.dictionaries || [],
        showDictionary: settings.showDictionary || 'unknown-or-marked',
        template: settings.template,
        blacklist: [],
        default: settings,
    };
}