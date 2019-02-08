import { loadInflection, loadFrequency, loadWhitelist, loadText } from './loader';
import { Dictionary } from '../common/dictionary';
import { buildLemmatizer } from './lemmatizer';
import { buildTrie } from './trie';
import { buildDictionaryAndFrequency } from './dictionary';
import { Progress } from '../common/importer';
import { EijiroImporterMessage } from './eijiro';

const ctx: Worker = self as any;

function isNumeric(n: string): boolean {
    return !isNaN(parseFloat(n));
}

function parseLine(line: string) {
    let [word, defStr] = line.substring(1).split(' : ', 2);

    const es = word.split('  ');
    let pos = null;
    if (es.length === 2) {
        [word, pos] = es;
        if (pos.startsWith('{') && pos.endsWith('}')) {
            pos = pos.slice(1, -1);
            const posElements = pos.split('-');
            if (posElements.length >= 2 && isNumeric(posElements[posElements.length - 1])) {
                pos = posElements.slice(0, -1).join('-');
            }
        } else {
            // broken entry
            return null;
        }
    }

    return { word, pos, defStr };
}

type MarkedString = (string | [string])[];

const BRACKETS = new Map<string, string>([
    ['［', '］'],
    ['《', '》'],
    ['（', '）'],
    ['【', '】'],
    ['〈', '〉'],
    ['〔', '〕'],
]);

const MISC_MARKERS = [
    '■',
    '◆',
];

export function markBrackets(defStr: string): MarkedString {
    const result: MarkedString = [];
    let closingBracket: string | null = null;
    let cursor = 0;

    const add = (to: number) => {
        if (cursor < to) {
            result.push(defStr.slice(cursor, to));
        }
    };
    for (let i = 0; i < defStr.length; i++) {
        const c = defStr[i];
        if (closingBracket !== null) {
            if (c === closingBracket) {
                result.push([defStr.slice(cursor, i + 1)]);
                closingBracket = null;
                cursor = i + 1;
            }
        } else {
            if (BRACKETS.has(c)) {
                add(i);
                closingBracket = BRACKETS.get(c)!;
                cursor = i;
            } else if (MISC_MARKERS.includes(c)) {
                add(i);
                result.push([defStr.slice(i, defStr.length)]);
                cursor = defStr.length;
                break;
            }
        }
    }
    add(defStr.length);

    let n = 0;
    for (const a of result) {
        if (typeof a === 'string') {
            n += a.length;
        } else {
            n += a[0].length;
        }
    }

    return result;
}

async function loadEijiro(
    eijiroURL: string,
    inflectionURL: string,
    frequencyURL: string,
    whitelistURL: string,
    chunkSize: number,
    progressFn: (progress: Progress) => void) {

    const eijiroContent = loadText(eijiroURL);
    const inflectionContent = loadText(inflectionURL);
    const frequencyContent = loadText(frequencyURL);
    const whitelistContent = loadText(whitelistURL);

    const TOTAL = 8;
    let step = 0;

    const m = async (msg: string, delta?: number) => {
        if (delta === undefined) delta = 1;
        step += delta;
        progressFn({ msg, ratio: step / TOTAL });
    };

    const whitelist = loadWhitelist(await whitelistContent);
    m('Loaded whitelist.');

    const lines = (await eijiroContent).split('\r\n');

    const entries = new Map<string, { pos: string | null, defStr: MarkedString }[]>();
    const infos = new Map<string, MarkedString>();
    for (let i = 0; i < lines.length; i++) {
        const DELTA = 10000;
        if (i % DELTA === 0) {
            m(`Parsed dictionary entries (${i} of ${lines.length}).`, DELTA / lines.length);
        }
        const line = lines[i];
        if (line.trim().length === 0) continue;

        const parsed = parseLine(line);
        if (parsed === null) {
            console.log(`Ignored: ${line}`);
            continue;
        }
        const { word, pos, defStr } = parsed;

        if (whitelist.has(word)) {
            if (pos === null && defStr.startsWith('【')) {
                if (infos.has(word)) {
                    console.log('Duplicate:', word, defStr, infos.get(word));
                }
                infos.set(word, markBrackets(defStr));
            } else {
                if (!entries.has(word)) {
                    entries.set(word, []);
                }
                entries.get(word)!.push({ pos, defStr: markBrackets(defStr) });
            }
        }
    }
    // TODO: increment step for the last less than 10000 lines

    type DictionaryItem = {
        word: string,
        info: MarkedString | null,
        entries: { pos: string | null, defs: MarkedString[] }[],
    };
    const dict: Dictionary = {};
    entries.forEach((dictInfo, word) => {
        const item: DictionaryItem = {
            word,
            info: null,
            entries: [],
        };
        const info = infos.get(word);
        if (info !== undefined) {
            item.info = info;
        }
        for (const { pos, defStr } of dictInfo) {
            let added = false;
            for (const entry of item.entries) {
                if (entry.pos === pos) {
                    entry.defs.push(defStr);
                    added = true;
                    break;
                }
            }
            if (!added) {
                item.entries.push({
                    pos,
                    defs: [defStr],
                });
            }
        }
        dict[word] = item;
    });
    m('Loaded dictionary.');

    const inflection = loadInflection(await inflectionContent);
    m('Loaded inflection.');

    const lemmatizer = buildLemmatizer(dict, inflection);
    m('Built lemmatizer.');

    const frequency = loadFrequency(await frequencyContent);
    m('Loaded frequency.');

    const { index, dictionaryChunks, freqs } = buildDictionaryAndFrequency(
        dict, lemmatizer, frequency, chunkSize);
    m('Built dictionary.');

    const trie = buildTrie(dict, lemmatizer);
    m('Built trie.');

    return { lemmatizer, trie, index, dictionaryChunks, freqs };
}

onmessage = async (e) => {
    const {
        eijiroURL,
        inflectionURL,
        frequencyURL,
        whitelistURL,
        chunkSize
    } = e.data;

    const { lemmatizer, trie, index, dictionaryChunks, freqs } =
        await loadEijiro(eijiroURL,
            inflectionURL,
            frequencyURL,
            whitelistURL,
            chunkSize, (progress: Progress) => {
                const msg: EijiroImporterMessage = { type: 'progress', progress };
                ctx.postMessage(msg);
            });
    const msg: EijiroImporterMessage = {
        type: 'done',
        lemmatizer,
        trie,
        index,
        dictionaryChunks,
        freqs,
    };
    ctx.postMessage(msg);
};