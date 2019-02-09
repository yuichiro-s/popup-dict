import * as fs from "fs";
import * as path from "path";

import { IDictionary, IIndex } from "../app/scripts/common/dictionary";
import { IFrequencyTable } from "../app/scripts/common/frequency";
import { ILemmatizer } from "../app/scripts/common/lemmatizer";
import { ITrieNode } from "../app/scripts/common/trie";

function writeJSON(obj: object, jsonPath: string) {
    console.log(`Writing to ${jsonPath} ...`);
    return new Promise((resolve) => {
        fs.writeFile(jsonPath, JSON.stringify(obj), "utf8", resolve);
    });
}

export async function writePackage(
    out: string,
    lemmatizer: ILemmatizer,
    trie: ITrieNode,
    freqs: IFrequencyTable,
    index: IIndex,
    dictionaryChunks: Map<number, IDictionary>,
    settings: string) {

    if (!fs.existsSync(out)) {
        await fs.promises.mkdir(out, { recursive: true });
    }

    const dictPath = path.join(out, "dictionary");
    if (!fs.existsSync(dictPath)) {
        await fs.promises.mkdir(dictPath, { recursive: true });
    }

    const p = (name: string) => path.join(out, name);
    const d = (name: string) => path.join(dictPath, name);

    await Promise.all([
        fs.promises.copyFile(settings, p("settings.toml")),
        writeJSON(lemmatizer, p("lemmatizer.json")),
        writeJSON(trie, p("trie.json")),
        writeJSON(freqs, p("frequency.json")),
        writeJSON(index, d("index.json")),
        Promise.all(
            Array.from(dictionaryChunks.entries()).map(([chunkIndex, dict]) =>
                writeJSON(dict, d(`subdict${chunkIndex}.json`))),
        ),
    ]);
}
