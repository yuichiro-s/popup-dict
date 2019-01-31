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
    template: string,
    blacklist: string[],
    default: Settings,
};

export function validateAndInit(settings: Settings) {
    function check(field: string) {
        if (!(field in settings)) {
            throw new Error(`${field} does not exist!`);
        }
    }
    check('id');
    check('name');
    check('languageCode');
    check('tokenizeByWhiteSpace');
    if (!settings.dictionaries) settings.dictionaries = [];
    if (!settings.showDictionary) settings.showDictionary = 'unknown-or-marked';
    if (!settings.template) settings.template = '';
    if (!settings.blacklist) settings.blacklist = [];
}