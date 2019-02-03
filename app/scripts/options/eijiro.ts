import { loadFile, importPackage } from './importer';
import { loadEijiro } from '../preprocess/eijiro';

export async function loadEijiroFromFiles(eijiroFile: File, inflectionFile: File, frequencyFile: File, whitelistFile: File, progressFn: (progress: number, msg: string) => void) {
    const inflectionContent = loadFile(inflectionFile);
    const frequencyContent = loadFile(frequencyFile);
    const eijiroContent = loadFile(eijiroFile);
    const whitelistContent = loadFile(whitelistFile);

    const { lemmatizer, trie, index, dictionaryChunks, freqs, settings }
        = await loadEijiro(eijiroContent, inflectionContent, frequencyContent, whitelistContent, 1000, progressFn);

    const subDictJSONs = new Map<number, string>();
    dictionaryChunks.forEach((value, key) => {
        subDictJSONs.set(key, JSON.stringify(value));
    });

    return importPackage(
        settings,
        JSON.stringify(trie),
        JSON.stringify(lemmatizer),
        JSON.stringify(index),
        subDictJSONs,
        JSON.stringify(freqs),
        progressFn,
    );
}
