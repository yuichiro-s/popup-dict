const fs = require('fs');
const path = require('path');
import { Lemmatizer } from '../app/scripts/background/lemmatizer';
import { TrieNode } from '../app/scripts/background/trie';
import { FrequencyTable } from '../app/scripts/background/frequency';
import { Index, Dictionary } from '../app/scripts/background/dictionary';

function writeJSON(obj: Object, path: string) {
    console.log(`Writing to ${path} ...`);
    return new Promise(resolve => {
        fs.writeFile(path, JSON.stringify(obj), 'utf8', resolve);
    });
}

export async function writePackage(
    out: string,
    lemmatizer: Lemmatizer,
    trie: TrieNode,
    freqs: FrequencyTable,
    index: Index,
    dictionaryChunks: Map<number, Dictionary>,
    settings: string) {

    if (!fs.existsSync(out)) {
        await fs.promises.mkdir(out, { recursive: true });
    }

    const dictPath = path.join(out, 'dictionary');
    if (!fs.existsSync(dictPath)) {
        await fs.promises.mkdir(dictPath, { recursive: true });
    }

    const p = (name: string) => path.join(out, name);
    const d = (name: string) => path.join(dictPath, name);

    await Promise.all([
        fs.promises.copyFile(settings, p('settings.toml')),
        writeJSON(lemmatizer, p('lemmatizer.json')),
        writeJSON(trie, p('trie.json')),
        writeJSON(freqs, p('frequency.json')),
        writeJSON(index, d('index.json')),
        Promise.all(
            Array.from(dictionaryChunks.entries()).map(([chunkIndex, dict]) =>
                writeJSON(dict, d(`subdict${chunkIndex}.json`)))
        ),
    ]);
}