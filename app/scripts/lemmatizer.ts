import { PackageID } from './packages';
import { CachedMap } from './cachedmap';
import { table } from './database';

type Lemmatizer = { [key: string]: string };

export async function lemmatize(tokens: string[], lang: PackageID): Promise<string[]> {
    let lemmatizer = await lemmatizers.get(lang);
    let lemmas = [];
    for (const token of tokens) {
        let lemma = lemmatizer[token] || token;
        lemmas.push(lemma);
    }
    return lemmas;
}

let lemmatizerTable = table('lemmatizers');
let lemmatizers = new CachedMap<PackageID, Lemmatizer>(lemmatizerTable.loader);
let importLemmatizer = lemmatizerTable.importer;
let deleteLemmatizer = lemmatizerTable.deleter;
export { importLemmatizer, deleteLemmatizer };
