import { Settings } from './package';
import { FrequencyTable } from './frequency';
import { TrieNode } from './trie';
import { Index, Dictionary } from './dictionary';
import { Lemmatizer } from './lemmatizer';

export type ImportMessage =
    {
        type: 'import-objects',
        settings: Settings,
        trie: TrieNode,
        lemmatizer: Lemmatizer,
        index: Index,
        subDicts: { [index: number]: Dictionary },
        frequency: FrequencyTable,
    } | {
        type: 'import-files',
        settings: Settings,
        trie: string,
        lemmatizer: string,
        index: string,
        subDicts: { [index: number]: string },
        frequency: string,
    };

export interface Progress {
    ratio: number;
    msg: string;
}