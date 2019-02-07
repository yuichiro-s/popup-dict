import { Dictionary } from '../common/dictionary';
import { Lemmatizer } from '../common/lemmatizer';
import { lemmatizeKeyStr } from './util';
import { add, createEmptyNode } from '../background/trie';
import { TrieNode } from '../common/trie';

export function buildTrie(dict: Dictionary, lemmatizer: Lemmatizer): TrieNode {
    const trie: TrieNode = createEmptyNode();

    for (const keyStr in dict) {
        const lemmas = lemmatizeKeyStr(keyStr, lemmatizer);
        add(trie, lemmas);
    }

    return trie;
}