export interface DictionaryItem { }

export type Key = string;
export type Lemma = string;
export type WordForm = string;

// Key -> DictionaryItem
export type Dictionary = { [key: string]: DictionaryItem };

// WordForm -> Lemma
export type Inflection = { [form: string]: Lemma };
export type Lemmatizer = { [form: string]: Lemma };