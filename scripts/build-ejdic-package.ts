import * as fs from "fs";
import * as readline from "readline";
import { buildDictionaryAndFrequency } from "../app/scripts/preprocess/dictionary";
import { buildLemmatizer } from "../app/scripts/preprocess/lemmatizer";
import { loadFrequency, loadInflection } from "../app/scripts/preprocess/loader";
import { buildTrie } from "../app/scripts/preprocess/trie";
import { writePackage } from "./util";

function parseArgs() {
    const argparse = require("argparse");
    const parser = argparse.ArgumentParser();
    parser.addArgument("--ejdic", {
        type: "string",
        help: "path to ejdic-hand-utf8.txt",
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

function loadEjdic(path: string): Promise<Array<{ word: string, entries: string[] }>> {
    const wordEntries: Array<{ word: string, entries: string[] }> = [];
    return new Promise((resolve) => {
        const instream = fs.createReadStream(path);
        const rl = readline.createInterface(instream);
        rl.on("line", (line: string) => {
            const [headwords, defs] = line.split("\t", 2);
            const headword = headwords.split(",")[0].trim();
            wordEntries.push({
                word: headword,
                entries: defs.split("/").map((d) => d.trim()),
            });
        });
        rl.on("close", () => {
            resolve(wordEntries);
        });
    });
}

async function main() {
    const args = parseArgs();

    console.log(`Loading ${args.ejdic} ...`);
    const ejdic = await loadEjdic(args.ejdic);

    const dict: { [key: string]: any } = {};
    for (const item of ejdic) {
        // note that 'constructor' key is already defined
        if (!(Array.isArray(dict[item.word]))) {
            dict[item.word] = [];
        }
        dict[item.word].push(item);
    }

    const inflectionContent = fs.promises.readFile(args.inflection);
    const rawFrequencyTableContent = fs.promises.readFile(args.frequency);

    console.log(`Loading ${args.inflection} ...`);
    const inflection = await loadInflection(await (await inflectionContent).toString());

    console.log(`Loading ${args.frequency} ...`);
    const rawFrequencyTable = await loadFrequency(await (await rawFrequencyTableContent).toString());

    console.log(`Building lemmatizer...`);
    const lemmatizer = buildLemmatizer(dict, inflection);

    console.log(`Building trie ...`);
    const trie = buildTrie(dict, lemmatizer);

    console.log(`Building dictionary and frequency ...`);
    const { index, dictionaryChunks, freqs } = buildDictionaryAndFrequency(
        dict, lemmatizer, rawFrequencyTable, args.chunk_size);
    await writePackage(args.out, lemmatizer, trie, freqs, index, dictionaryChunks, args.settings);

    console.log("Done.");
}

main();
