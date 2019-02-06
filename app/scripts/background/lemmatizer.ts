import { PackageID } from '../common/package';
import { CachedMap } from '../common/cachedmap';
import { get } from '../common/objectmap';
import { table } from './database';

// word form -> lemma
export type Lemmatizer = { [key: string]: string };

export function lemmatizeKeyStr(keyStr: string, lemmatizer: Lemmatizer): string[] {
    const tokens = keyStr.split(' ');
    return lemmatizeTokens(tokens, lemmatizer);
}

export function lemmatize(token: string, lemmatizer: Lemmatizer): string {
    return get(lemmatizer, token) || token;
}

export function lemmatizeTokens(tokens: string[], lemmatizer: Lemmatizer): string[] {
    let lemmas = [];
    for (const token of tokens) {
        let lemma = lemmatize(token, lemmatizer);
        lemmas.push(lemma);
    }
    return lemmas;
}

export async function lemmatizeWithPackage(tokens: string[], pkgId: PackageID): Promise<string[]> {
    let lemmatizer = await lemmatizers.get(pkgId);
    return lemmatizeTokens(tokens, lemmatizer);
}

export function getLammatizer(pkgId: PackageID): Promise<Lemmatizer> {
    return lemmatizers.get(pkgId);
}

let lemmatizerTable = table('lemmatizers');
let lemmatizers = new CachedMap<PackageID, Lemmatizer>(lemmatizerTable.loader);
let importLemmatizer = lemmatizerTable.importer;
let deleteLemmatizer = lemmatizerTable.deleter;
export { importLemmatizer, deleteLemmatizer };
