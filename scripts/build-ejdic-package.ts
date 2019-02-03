const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const { buildLemmatizer } = require('../app/scripts/preprocess/lemmatizer');
const { buildTrie } = require('../app/scripts/preprocess/trie');
const { buildDictionaryAndFrequency } = require('../app/scripts/preprocess/dictionary');
const { loadInflection, loadFrequency } = require('../app/scripts/preprocess/loader');
const { writePackage } = require('./util');

function parseArgs() {
    const argparse = require('argparse');
    const parser = argparse.ArgumentParser();
    parser.addArgument('--ejdic', {
        type: 'string',
        help: 'path to ejdic-hand-utf8.txt',
    });
    parser.addArgument('--inflection', {
        type: 'string',
        help: 'path to inflection',
    });
    parser.addArgument('--frequency', {
        type: 'string',
        help: 'path to frequency',
    });
    parser.addArgument('--settings', {
        type: 'string',
        help: 'path to settings.toml',
    });
    parser.addArgument('--chunk-size', {
        type: 'int',
        help: 'size of dictionary chunks',
    });
    parser.addArgument('--out', {
        type: 'string',
        help: 'output directory',
    });
    return parser.parseArgs();
}

function loadEjdic(path: string): Promise<{ word: string, entries: string[] }[]> {
    const d: { word: string, entries: string[] }[] = [];
    return new Promise((resolve) => {
        const instream = fs.createReadStream(path);
        const outstream = new stream();
        const rl = readline.createInterface(instream, outstream);
        rl.on('line', (line: string) => {
            const [headwords, defs] = line.split('\t', 2);
            const headword = headwords.split(',')[0].trim();
            d.push({
                word: headword,
                entries: defs.split('/').map(d => d.trim()),
            });
        });
        rl.on('close', () => {
            resolve(d);
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

    console.log('Done.');
}

main();