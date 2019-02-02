import { PackageID } from '../common/package';
import { CachedMap } from '../common/cachedmap';
import { get } from '../common/objectmap';
import { table } from './database';

// word form -> lemma
export type Lemmatizer = { [key: string]: string };

export function lemmatizeKeyStr(keyStr: string, lemmatizer: Lemmatizer): string[] {
    const tokens = keyStr.split(' ');
    return lemmatize(tokens, lemmatizer);
}

export function lemmatize(tokens: string[], lemmatizer: Lemmatizer): string[] {
    let lemmas = [];
    for (const token of tokens) {
        let lemma = get(lemmatizer, token) || token;
        lemmas.push(lemma);
    }
    return lemmas;
}

export async function lemmatizeWithPackage(tokens: string[], lang: PackageID): Promise<string[]> {
    let lemmatizer = await lemmatizers.get(lang);
    return lemmatize(tokens, lemmatizer);
}

let lemmatizerTable = table('lemmatizers');
let lemmatizers = new CachedMap<PackageID, Lemmatizer>(lemmatizerTable.loader);
let importLemmatizer = lemmatizerTable.importer;
let deleteLemmatizer = lemmatizerTable.deleter;
export { importLemmatizer, deleteLemmatizer };
