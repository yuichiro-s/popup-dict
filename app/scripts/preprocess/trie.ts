import { Dictionary } from '../background/dictionary';
import { Lemmatizer } from '../background/lemmatizer';
import { lemmatizeKeyStr } from './util';
import { TrieNode, add, createEmptyNode } from '../background/trie';

export function buildTrie(dict: Dictionary, lemmatizer: Lemmatizer): TrieNode {
    const trie: TrieNode = createEmptyNode();

    for (const keyStr in dict) {
        const lemmas = lemmatizeKeyStr(keyStr, lemmatizer);
        add(trie, lemmas);
    }

    return trie;
}