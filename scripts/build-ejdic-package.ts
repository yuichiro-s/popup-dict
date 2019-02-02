const fs = require('fs');
const path = require('path');
const readline = require('readline');
const stream = require('stream');
const { buildLemmatizer } = require('../app/scripts/preprocess/lemmatizer');
const { buildTrie } = require('../app/scripts/preprocess/trie');
const { buildDictionaryAndFrequency } = require('../app/scripts/preprocess/dictionary');

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

function loadEjdic(path: string): Promise<{word: string, entries: string[]}[]> {
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

async function loadInflection(path: string) {
    const content = await (await fs.promises.readFile(path)).toString();
    const inflection: { [form: string]: string } = {};
    for (const line of content.split('\n')) {
        const [orig, form] = line.split('\t');
        inflection[form] = orig;
    }
    return inflection;
}

async function loadFrequency(path: string) {
    const content = await (await fs.promises.readFile(path)).toString();
    const rawFrequencyTable: { [form: string]: number } = {};
    for (const line of content.split('\n')) {
        const [form, freqStr] = line.split(' ');
        rawFrequencyTable[form] = parseInt(freqStr);
    }
    return rawFrequencyTable;
}

function writeJSON(obj: Object, path: string) {
    console.log(`Writing to ${path} ...`);
    return new Promise(resolve => {
        fs.writeFile(path, JSON.stringify(obj), 'utf8', resolve);
    });
}

async function main() {
    const args = parseArgs();

    console.log(`Loading ${args.ejdic} ...`);
    const ejdic = await loadEjdic(args.ejdic);

    const dict: {[key: string]: any} = {};
    for (const item of ejdic) {
        // note that 'constructor' key is already defined
        if (!(Array.isArray(dict[item.word]))) {
            dict[item.word] = [];
        }
        dict[item.word].push(item);
    }

    console.log(`Loading ${args.inflection} ...`);
    const inflection = await loadInflection(args.inflection);

    console.log(`Loading ${args.frequency} ...`);
    const rawFrequencyTable = await loadFrequency(args.frequency);

    console.log(`Building lemmatizer...`);
    const lemmatizer = buildLemmatizer(dict, inflection);

    console.log(`Building trie ...`);
    const trie = buildTrie(dict, lemmatizer);

    console.log(`Building dictionary and frequency ...`);
    const { index, dictionaryChunks, freqs } = buildDictionaryAndFrequency(
        dict, lemmatizer, rawFrequencyTable, args.chunk_size);

    if (!fs.existsSync(args.out)) {
        await fs.promises.mkdir(args.out, { recursive: true });
    }

    const dictPath = path.join(args.out, 'dictionary');
    if (!fs.existsSync(dictPath)) {
        await fs.promises.mkdir(dictPath, { recursive: true });
    }

    const p = (name: string) => path.join(args.out, name);
    const d = (name: string) => path.join(dictPath, name);
    await Promise.all([
        fs.promises.copyFile(args.settings, p('settings.toml')),
        writeJSON(lemmatizer, p('lemmatizer.json')),
        writeJSON(trie, p('trie.json')),
        writeJSON(freqs, p('frequency.json')),
        writeJSON(index, d('index.json')),
        Promise.all(
            Array.from(dictionaryChunks.entries()).map(([chunkIndex, dict]) =>
                writeJSON(dict, d(`subdict${chunkIndex}.json`)))
        ),
    ]);

    console.log('Done.');
}

main();