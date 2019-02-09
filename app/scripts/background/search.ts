import { CachedMap } from "../common/cachedmap";
import { Entry } from "../common/entry";
import { PackageID } from "../common/package";
import { ISpan } from "../common/search";
import { ITrieNode } from "../common/trie";
import { getTable } from "./database";
import { lookUpEntries } from "./entry";
import { getLammatizer, lemmatize } from "./lemmatizer";
import { exists, findAllOccurrences } from "./trie";

export async function searchAllBatch(pkgId: PackageID, tokensBatch: string[][]) {
    const results = [];
    for (const tokens of tokensBatch) {
        results.push(await searchAll(pkgId, tokens));
    }
    return results;
}

// TODO: support non-English alphabets
function isUpper(lemma: string): boolean {
    return lemma[0].toLowerCase() !== lemma[0];
}

async function searchAll(pkgId: PackageID, tokens: string[]) {
    const trie = await tries.get(pkgId);
    const lemmatizer = await getLammatizer(pkgId);

    const lemmasWithAlternatives = [];
    for (const token of tokens) {
        const lemma = lemmatize(token, lemmatizer);
        if (isUpper(token)) {
            // try first with the original form, then one with the first letter lowercased
            const alternative = lemmatize(token.toLowerCase(), lemmatizer);
            lemmasWithAlternatives.push([lemma, alternative]);
        } else {
            lemmasWithAlternatives.push(lemma);
        }
    }

    const keys = findAllOccurrences(trie, lemmasWithAlternatives);

    const spans: ISpan[] = [];
    const entries = await lookUpEntries(pkgId, keys.map((k) => k.key));
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const entry = entries[i];
        if (entry) {
            const span: ISpan = {
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
    } else {
        return null;
    }
}

export function getTrie(pkgId: PackageID): Promise<ITrieNode> {
    return tries.get(pkgId);
}

const trieTable = getTable<PackageID, ITrieNode>("tries");
const tries = new CachedMap<PackageID, ITrieNode>(trieTable.loader);
const importTrie = trieTable.importer;
const deleteTrie = trieTable.deleter;
export { importTrie, deleteTrie };
