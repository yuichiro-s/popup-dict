import { IDictionary, IIndex } from "../common/dictionary";
import { IFrequencyTable } from "../common/frequency";
import { ILemmatizer } from "../common/lemmatizer";
import { get } from "../common/objectmap";
import { lemmatizeKeyStr } from "./util";

export function buildDictionaryAndFrequency(
    dict: IDictionary,
    lemmatizer: ILemmatizer,
    rawFrequencyTable: IFrequencyTable,
    chunkSize: number,
    splitCharacters: boolean = false) {
    // Note: keys in rawFrequencyTable are assumed to be lowercased

    // aggregate frequency of all word forms
    const frequencyTable: IFrequencyTable = {};
    for (const [keyStr, freq] of Object.entries(rawFrequencyTable)) {
        const key = lemmatizeKeyStr(keyStr, lemmatizer).join(splitCharacters ? "" : " ");
        frequencyTable[key] = (get(frequencyTable, key) || 0) + freq;
    }

    const dictWithKeysLemmatized: IDictionary = {};
    const freqs: { [key: string]: number } = {};
    for (const [keyStr, dictionaryItem] of Object.entries(dict)) {
        const key = lemmatizeKeyStr(keyStr, lemmatizer).join(" ");
        const freqKey = lemmatizeKeyStr(keyStr, lemmatizer).join(splitCharacters ? "" : " ").toLowerCase();
        freqs[key] = get(frequencyTable, freqKey) || 0;
        dictWithKeysLemmatized[key] = dictionaryItem;
    }

    // split entries into chunks
    const index: IIndex = {};
    const dictionaryChunks = new Map<number, IDictionary>();
    // sort keys in descending order of frequency
    const keys: string[] = Object.keys(dictWithKeysLemmatized).sort((a, b) => freqs[b] - freqs[a]);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const chunkIndex = Math.floor(i / chunkSize);
        index[key] = chunkIndex;
        const dictionaryItem = get(dictWithKeysLemmatized, key)!;
        if (!dictionaryChunks.has(chunkIndex)) {
            dictionaryChunks.set(chunkIndex, {});
        }
        dictionaryChunks.get(chunkIndex)![key] = dictionaryItem;
    }

    return { index, dictionaryChunks, freqs };
}
