import { Settings } from './package';

export type ImportMessage =
    {
        type: 'import-files',
        settings: Settings,
        trie: string,
        lemmatizer: string,
        index: string,
        subDicts: { [index: number]: string },
        frequency: string,
    } | {
        type: 'import-eijiro',
        eijiro: string,
        inflection: string,
        frequency: string,
        whitelist: string,
    };

export interface Progress {
    ratio: number;
    msg: string;
}