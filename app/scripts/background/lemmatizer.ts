import { CachedMap } from "../common/cachedmap";
import { ILemmatizer } from "../common/lemmatizer";
import { get } from "../common/objectmap";
import { PackageID } from "../common/package";
import { getTable } from "./database";

export function lemmatize(token: string, lemmatizer: ILemmatizer): string {
    return get(lemmatizer, token) || token;
}

export function lemmatizeTokens(tokens: string[], lemmatizer: ILemmatizer): string[] {
    const lemmas = [];
    for (const token of tokens) {
        const lemma = lemmatize(token, lemmatizer);
        lemmas.push(lemma);
    }
    return lemmas;
}

export async function lemmatizeWithPackage(tokens: string[], pkgId: PackageID): Promise<string[]> {
    const lemmatizer = await lemmatizers.get(pkgId);
    return lemmatizeTokens(tokens, lemmatizer);
}

export function getLammatizer(pkgId: PackageID): Promise<ILemmatizer> {
    return lemmatizers.get(pkgId);
}

const lemmatizerTable = getTable<PackageID, ILemmatizer>("lemmatizers");
const lemmatizers = new CachedMap<PackageID, ILemmatizer>(lemmatizerTable.loader);
const importLemmatizer = lemmatizerTable.importer;
const deleteLemmatizer = lemmatizerTable.deleter;
export { importLemmatizer, deleteLemmatizer };
