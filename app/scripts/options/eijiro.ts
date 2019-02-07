import { loadFile, importPackage } from './importer';
import { loadEijiro } from '../preprocess/eijiro';
import { Dictionary } from '../common/dictionary';
import { Progress } from '../common/importer';


export async function loadEijiroFromFiles(eijiroFile: File, inflectionFile: File, frequencyFile: File, whitelistFile: File, progressFn: (progress: Progress) => void) {
    const inflectionContent = loadFile(inflectionFile);
    const frequencyContent = loadFile(frequencyFile);
    const eijiroContent = loadFile(eijiroFile);
    const whitelistContent = loadFile(whitelistFile);

    const { lemmatizer, trie, index, dictionaryChunks, freqs, settings }
        = await loadEijiro(eijiroContent, inflectionContent, frequencyContent, whitelistContent, 1000, progressFn);

    const subDicts: { [n: number]: Dictionary } = {};
    dictionaryChunks.forEach((value: Dictionary, key: number) => {
        subDicts[key] = value;
    });

    return importPackage(
        {
            type: 'import-objects',
            settings,
            trie,
            lemmatizer,
            index,
            subDicts,
            frequency: freqs,
        },
        progressFn,
    );
}
