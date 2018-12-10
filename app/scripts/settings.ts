export type DictionaryInfo = {
    name: string,
    pattern: string,
};

export type Settings = {
    id: string,
    name: string,
    languageCode: string,
    tokenizeByWhiteSpace: boolean,
    dictionaries: DictionaryInfo[]
};