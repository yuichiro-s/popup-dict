export interface DictionaryItem {
}

// lemma -> dictionary item
export type Dictionary = { [key: string]: DictionaryItem };

// lemma -> index
export type Index = { [key: string]: number };