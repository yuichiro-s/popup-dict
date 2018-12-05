import { Language } from './languages';
import { CachedMap } from './cachedmap';

let lemmatizers = new CachedMap<Language, { [key: string]: string }>(loadLemmatizer);

export async function loadLemmatizer(lang: Language) {
    let path = chrome.runtime.getURL(`data/${lang}/lemmatizer.json`);
    console.log('Loading inflection patterns for ' + lang + ' ...');
    let response = await fetch(path);
    let res = await response.text();
    let obj = JSON.parse(res)!;
    console.log(`Loaded inflection patterns for ${lang}.`);
    return obj;
}

export async function lemmatize(tokens: string[], lang: Language): Promise<string[]> {
    let lemmatizer = await lemmatizers.get(lang);
    let lemmas = [];
    for (const token of tokens) {
        let lemma = lemmatizer[token] || token;
        lemmas.push(lemma);
    }

    return lemmas;
}
