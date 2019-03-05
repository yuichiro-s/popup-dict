import * as fs from "fs";
import * as readline from "readline";

import { IDictionary } from "../app/scripts/common/dictionary";
import { has } from "../app/scripts/common/objectmap";
import { buildDictionaryAndFrequency } from "../app/scripts/preprocess/dictionary";
import { buildLemmatizer } from "../app/scripts/preprocess/lemmatizer";
import { loadFrequency, loadInflection } from "../app/scripts/preprocess/loader";
import { buildTrie } from "../app/scripts/preprocess/trie";
import { writePackage } from "./util";

function parseArgs() {
    const argparse = require("argparse");
    const parser = argparse.ArgumentParser();
    parser.addArgument("--dict", {
        type: "string",
    });
    parser.addArgument("--inflection", {
        type: "string",
        help: "path to inflection",
    });
    parser.addArgument("--frequency", {
        type: "string",
        help: "path to frequency",
    });
    parser.addArgument("--settings", {
        type: "string",
        help: "path to settings.toml",
    });
    parser.addArgument("--chunk-size", {
        type: "int",
        help: "size of dictionary chunks",
    });
    parser.addArgument("--out", {
        type: "string",
        help: "output directory",
    });
    return parser.parseArgs();
}

function loadDict(path: string): Promise<IDictionary> {
    const dict: { [key: string]: any[] } = {};
    return new Promise((resolve) => {
        const instream = fs.createReadStream(path);
        const rl = readline.createInterface(instream);
        rl.on("line", (line: string) => {
            const entry = JSON.parse(line);
            const key = entry.word;
            if (!(has(dict, key))) {
                dict[key] = [];
            }
            dict[key].push(entry);
        });

        rl.on("close", () => {
            resolve(dict);
        });
    });
}

async function main() {
    const args = parseArgs();

    const inflectionContent = fs.promises.readFile(args.inflection);
    const rawFrequencyTableContent = fs.promises.readFile(args.frequency);

    console.log(`Loading ${args.inflection} ...`);
    const inflection = inflectionContent.then((c) => c.toString()).then(loadInflection);

    console.log(`Loading ${args.frequency} ...`);
    const rawFrequencyTable = rawFrequencyTableContent.then((c) => c.toString()).then(loadFrequency);

    console.log(`Loading ${args.cedict} ...`);
    const dict = await loadDict(args.dict);

    console.log(`Building lemmatizer...`);
    const lemmatizer = buildLemmatizer(dict, await inflection);

    console.log(`Building trie ...`);
    const trie = buildTrie(dict, lemmatizer);

    console.log(`Building dictionary and frequency ...`);
    const { index, dictionaryChunks, freqs } = buildDictionaryAndFrequency(
        dict, lemmatizer, await rawFrequencyTable, args.chunk_size);
    await writePackage(args.out, lemmatizer, trie, freqs, index, dictionaryChunks, args.settings);

    console.log("Done.");
}

main();
