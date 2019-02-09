import { add, createEmptyNode } from "../background/trie";
import { IDictionary } from "../common/dictionary";
import { ILemmatizer } from "../common/lemmatizer";
import { keys } from "../common/objectmap";
import { ITrieNode } from "../common/trie";
import { lemmatizeKeyStr } from "./util";

export function buildTrie(dict: IDictionary, lemmatizer: ILemmatizer): ITrieNode {
    const trie: ITrieNode = createEmptyNode();

    for (const keyStr of keys(dict)) {
        const lemmas = lemmatizeKeyStr(keyStr, lemmatizer);
        add(trie, lemmas);
    }

    return trie;
}
