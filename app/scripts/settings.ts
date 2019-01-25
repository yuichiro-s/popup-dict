export type DictionaryInfo = {
    name: string,
    pattern: string,
};

export type ShowDictionary = 'always' | 'unknown-or-marked' | 'never';

export type Settings = {
    id: string,
    name: string,
    languageCode: string,
    tokenizeByWhiteSpace: boolean,
    dictionaries: DictionaryInfo[],
    showDictionary: ShowDictionary,
};