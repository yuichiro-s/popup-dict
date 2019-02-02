import { Dictionary, Index } from '../background/dictionary';
import { FrequencyTable } from '../background/frequency';
import { Lemmatizer, lemmatizeKeyStr } from '../background/lemmatizer';

export function buildDictionaryAndFrequency(dict: Dictionary, lemmatizer: Lemmatizer, rawFrequencyTable: FrequencyTable, chunkSize: number) {
    // Note: keys in rawFrequencyTable are assumed to be lowercased

    // aggregate frequency of all word forms
    const frequencyTable: FrequencyTable = {};
    for (const [keyStr, freq] of Object.entries(rawFrequencyTable)) {
        let key = lemmatizeKeyStr(keyStr, lemmatizer).join(' ');
        frequencyTable[key] = (frequencyTable[key] || 0) + freq;
    }

    const dictWithKeysLemmatized: Dictionary = {};
    const freqs: { [key: string]: number } = {};
    for (const [keyStr, dictionaryItem] of Object.entries(dict)) {
        const key = lemmatizeKeyStr(keyStr, lemmatizer).join(' ');
        const freqKey = key.toLowerCase();
        freqs[key] = frequencyTable[freqKey] || 0;
        dictWithKeysLemmatized[key] = dictionaryItem;
    }

    // split entries into chunks
    const index: Index = {};
    const dictionaryChunks = new Map<number, Dictionary>();
    // sort keys in descending order of frequency
    const keys: string[] = Object.keys(dictWithKeysLemmatized).sort((a, b) => freqs[b] - freqs[a]);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const chunkIndex = Math.floor(i / chunkSize);
        index[key] = chunkIndex;
        const dictionaryItem = dictWithKeysLemmatized[key];
        if (!dictionaryChunks.has(chunkIndex)) {
            dictionaryChunks.set(chunkIndex, {});
        }
        dictionaryChunks.get(chunkIndex)![key] = dictionaryItem;
    }

    return { index, dictionaryChunks, freqs };
}