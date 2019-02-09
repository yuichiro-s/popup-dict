export interface IDictionaryItem {}

// lemma -> dictionary item
export interface IDictionary { [key: string]: IDictionaryItem; }

// lemma -> index
export interface IIndex { [key: string]: number; }
