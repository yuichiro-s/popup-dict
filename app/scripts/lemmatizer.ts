import { Language } from './languages';
import { CachedMap } from './cachedmap';

import Dexie from 'dexie';

type Lemmatizer = { [key: string]: string };
interface Entry {
    lang: Language;
    lemmatizer: Lemmatizer;
}

class Database extends Dexie {
    lemmatizers: Dexie.Table<Entry, Language>;
    constructor() {
        super('lemmatizers');
        this.version(1).stores({
            lemmatizers: 'lang'
        });
    }
}
let db = new Database();

let lemmatizers = new CachedMap<Language, Lemmatizer>(loadLemmatizer);

function loadLemmatizer(lang: Language) {
    return new Promise((resolve, reject) => {
        console.log('Loading inflection patterns for ' + lang + ' ...');
        db.lemmatizers.get(lang).then(result => {
            if (result === undefined) {
                //reject(`Lemmatizer for ${lang} not found.`);
                let path = chrome.runtime.getURL(`data/${lang}/lemmatizer.json`);
                fetch(path).then(response => {
                    response.text().then(res => {
                        let lemmatizer = JSON.parse(res)!;
                        db.lemmatizers.put({ lang, lemmatizer }).then(() => {
                            console.log(`Loaded inflection patterns from file for ${lang}.`);
                            resolve(lemmatizer);
                        });
                    });
                });
            } else {
                console.log(`Loaded inflection patterns for ${lang}.`);
                resolve(result.lemmatizer);
            }
        }).catch(reject);
    });
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
