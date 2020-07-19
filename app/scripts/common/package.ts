export type PackageID = string;

export interface IDictionaryInfo {
    name: string;
    pattern: string;
}

export type ShowDictionary = "always" | "unknown-or-marked" | "never";

export interface IPackage extends ISettings {
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
    tts: boolean;
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
        tts: settings.tts || false,
        default: settings,
    };
}
