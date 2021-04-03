import { get, has } from "../common/objectmap";
import { EXISTS, ITrieNode, NEXT } from "../common/trie";

export function createEmptyNode(): ITrieNode {
    return { [NEXT]: {}, [EXISTS]: false };
}

export function add(root: ITrieNode, key: string[]) {
    let node = root;
    for (const lemma of key) {
        if (!(has(node[NEXT], lemma))) {
            node[NEXT][lemma] = createEmptyNode();
        }
        node = get(node[NEXT], lemma)!;
    }
    node[EXISTS] = true;
}

export function isEnd(node: ITrieNode) {
    return node[EXISTS];
}

export function exists(trie: ITrieNode, key: string[]): boolean {
    const length = key.length;
    function dfs(node: ITrieNode, i: number): boolean {
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

export function getKeys(root: ITrieNode): string[][] {
    const keys: string[][] = [];
    function dfs(node: ITrieNode, prefix: string[]) {
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

export function findAllOccurrences(trie: ITrieNode, tokens: (string | string[])[]) {
    // alternatives of only the first token are considered

    const keys = [];
    let start = 0;
    while (start < tokens.length) {
        let alternatives: string[];
        if (typeof tokens[start] === "string") {
            alternatives = [tokens[start] as string];
        } else {
            alternatives = tokens[start] as string[];
        }

        let notFound = true;
        for (const first of alternatives) {
            let node = trie;
            let cursor = start;
            let lastMatch = 0;
            const lemmas = [];
            while (cursor < tokens.length) {
                let lemma;
                if (cursor === start) {
                    lemma = first;
                } else {
                    if (typeof tokens[cursor] === "string") {
                        lemma = tokens[cursor] as string;
                    } else {
                        // only try with the first alternative
                        lemma = tokens[cursor][0] as string;
                    }
                }
                if (!(has(node[NEXT], lemma))) {
                    break;
                }
                node = get(node[NEXT], lemma)!;
                cursor++;
                lemmas.push(lemma);
                if (isEnd(node)) {
                    lastMatch = cursor;
                }
            }
            if (lastMatch > 0) {
                const key = lemmas.slice(0, lastMatch - start);
                keys.push({ begin: start, end: lastMatch, key });
                start = lastMatch;
                notFound = false;
                break;
            }
        }
        if (notFound) { start++; }
    }
    return keys;
}
