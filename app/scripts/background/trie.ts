import { has, get } from '../common/objectmap';

export const NEXT = 'n';
export const EXISTS = 'e';

export type TrieNode = {
    [NEXT]: { [c: string]: TrieNode };
    [EXISTS]: boolean;
};

export function createEmptyNode(): TrieNode {
    return { [NEXT]: {}, [EXISTS]: false };
}

export function add(root: TrieNode, key: string[]) {
    let node = root;
    for (const lemma of key) {
        if (!(has(node[NEXT], lemma))) {
            node[NEXT][lemma] = createEmptyNode();
        }
        node = get(node[NEXT], lemma)!;
    }
    node[EXISTS] = true;
}

export function isEnd(node: TrieNode) {
    return node[EXISTS];
}

export function exists(trie: TrieNode, key: string[]): boolean {
    const length = key.length;
    function dfs(node: TrieNode, i: number): boolean {
        if (i >= length) {
            return isEnd(node);
        } else {
            const token = key[i];
            const next = get(node[NEXT], token);
            if (next === undefined) {
                return false;
            } else {
                return dfs(next, i + 1);
            }
        }
    }
    return dfs(trie, 0);
}

export function getKeys(root: TrieNode): string[][] {
    const keys: string[][] = [];
    function dfs(node: TrieNode, prefix: string[]) {
        if (isEnd(node)) {
            keys.push(prefix);
        }
        for (const [c, next] of Object.entries(node[NEXT])) {
            dfs(next, prefix.concat([c]));
        }
    }
    dfs(root, []);
    return keys;
}

export function findAllOccurrences(trie: TrieNode, tokens: string[]) {
    let keys = [];
    let start = 0;
    while (start < tokens.length) {
        let node = trie;
        let cursor = start;
        let lastMatch = 0;
        while (cursor < tokens.length) {
            const lemma = tokens[cursor];
            if (!(has(node[NEXT], lemma))) {
                break;
            }
            node = get(node[NEXT], lemma)!;
            cursor++;
            if (isEnd(node)) {
                lastMatch = cursor;
            }
        }
        if (lastMatch > 0) {
            const key = tokens.slice(start, lastMatch);
            keys.push({ begin: start, end: lastMatch, key });
            start = lastMatch;
        } else {
            start++;
        }
    }
    return keys;
}
