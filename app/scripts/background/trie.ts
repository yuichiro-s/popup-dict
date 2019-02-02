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

// TODO: support non-English alphabets
function isUpper(lemma: string): boolean {
    return lemma[0].toLowerCase() !== lemma[0];
}

function lowerCaseFirstLetter(lemma: string): string {
    return lemma[0].toLowerCase() + lemma.slice(1);
}

export function findAllOccurrences(trie: TrieNode, tokens: string[], retryWithLowerCase: boolean) {
    let keys = [];
    let start = 0;
    while (start < tokens.length) {
        let retry = false;
        while (true) {
            let node = trie;
            let cursor = start;
            let lastMatch = 0;
            while (cursor < tokens.length) {
                let lemma = tokens[cursor];
                if (retry && cursor === start) {
                    // if it's the second trial, lowercase the first token
                    lemma = lowerCaseFirstLetter(lemma);
                }
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
                if (retry) {
                    key[0] = lowerCaseFirstLetter(key[0]);
                }
                keys.push({ begin: start, end: lastMatch, key });
                start = lastMatch;
                retry = false;
            } else {
                if (retryWithLowerCase && !retry && isUpper(tokens[start])) {
                    retry = true;
                } else {
                    start++;
                    retry = false;
                }
            }
            if (!retry) break;
        }
    }
    return keys;
}
