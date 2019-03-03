
import * as fs from "fs";
import * as readline from "readline";
const PinyinConverter = require("pinyin-converter");

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
    parser.addArgument("--cedict", {
        type: "string",
        help: "path to cedict_ts.u8",
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

function loadCedict(path: string): Promise<IDictionary> {
    const dict: { [key: string]: any[] } = {};
    return new Promise((resolve) => {
        const instream = fs.createReadStream(path);
        const rl = readline.createInterface(instream);
        rl.on("line", (line: string) => {
            if (line.startsWith("#")) { return; }
            const es = line.trim().split(" ");
            const [traditional, simplified] = es;
            let definition = es.slice(2).join(" ");

            // treat each character as word
            const key = simplified.split("").join(" ");

            const pos = definition.indexOf("]");
            const pronunciation = definition.substring(1, pos);
            definition = definition.substring(pos + 2);
            const definitionList = [];
            for (const d of definition.split("/")) {
                if (d.length > 0) {
                    definitionList.push(d);
                }
            }

            const entry = {
                simplified,
                pinyin: PinyinConverter.convert(pronunciation),
                defs: definitionList,
                ...simplified !== traditional ? { traditional } : {},
            };

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
    const dict = await loadCedict(args.cedict);

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
