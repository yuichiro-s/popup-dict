import { PackageID } from '../common/package';
import { CachedMap } from '../common/cachedmap';
import { Entry } from '../common/entry';
import { Span } from '../common/search';
import { get, has } from '../common/objectmap';
import { table } from './database';
import { lookUpEntries } from './entry';
import { NEXT, isEnd, exists, TrieNode } from './trie';
import { lemmatizeWithPackage } from './lemmatizer';

export async function searchAllBatch(pkgId: PackageID, tokensBatch: string[][]) {
    let results = [];
    for (let tokens of tokensBatch) {
        results.push(await searchAll(pkgId, tokens));
    }
    return results;
}

async function searchAll(pkgId: PackageID, tokens: string[]) {
    let trie = await tries.get(pkgId);
    const lemmas = await lemmatizeWithPackage(tokens, pkgId);

    let spans: Span[] = [];
    let keys = [];
    let start = 0;
    while (start < lemmas.length) {
        let node = trie;
        let cursor = start;
        let lastMatch = 0;
        while (cursor < lemmas.length) {
            const lemma = lemmas[cursor];
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
            // Note that `text` is normalized
            // TODO: batch lookups
            const key = lemmas.slice(start, lastMatch);
            keys.push({ begin: start, end: lastMatch, key });
            start = lastMatch;
        }
        else {
            start++;
        }
    }
    let entries = await lookUpEntries(pkgId, keys.map((k) => k.key));
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let entry = entries[i];
        if (entry) {
            let span: Span = {
                begin: key.begin,
                end: key.end,
                key: key.key,
                entry,
            };
            spans.push(span);
        }
    }
    return spans;
}

export async function searchWithPackage(pkgId: PackageID, key: string[]): Promise<Entry | null> {
    const trie = await tries.get(pkgId);
    if (exists(trie, key)) {
        return (await lookUpEntries(pkgId, [key]))[0];
    }
    else {
        return null;
    }
}

export function getTrie(pkgId: PackageID): Promise<TrieNode> {
    return tries.get(pkgId);
}

let trieTable = table('tries');
let tries = new CachedMap<PackageID, TrieNode>(trieTable.loader);
let importTrie = trieTable.importer;
let deleteTrie = trieTable.deleter;
export { importTrie, deleteTrie };