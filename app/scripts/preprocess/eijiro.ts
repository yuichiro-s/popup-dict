import { loadInflection, loadFrequency, loadWhitelist } from './loader';
import { Dictionary } from '../background/dictionary';
import { buildLemmatizer } from './lemmatizer';
import { buildTrie } from './trie';
import { buildDictionaryAndFrequency } from './dictionary';
import { Settings } from '../common/package';

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

const TEMPLATE = `

{{#*inline "markedStr"}}
    {{#each str}}
        {{#ifString this}}
            {{this}}
        {{else}}
            <span style="color: #666666;">{{this.[0]}}</span>
        {{/ifString}}
    {{/each}}
{{/inline}}

{{#*inline "line"}}
    <hr class="dictionary-entry-separator"></hr>
{{/inline}}

<div class="dictionary-tooltip">

{{#if info}}
    <div>{{> markedStr str=info }}</div>
    {{> line }}
{{/if}}

{{#each entries}}
    {{#unless @first}}
        {{> line }}
    {{/unless}}
    <div>
        <span class="dictionary-entry-word">{{../word}}</span>
        <span class="dictionary-entry">
            <span class="dictionary-entry-pos">{{this.pos}}</span>
            <span class="dictionary-entry-defs">
                {{#each this.defs}}
                    <span class="dictionary-entry-bullet">►</span>
                    <span class="dictionary-entry-def">{{> markedStr str=this }}</span>
                {{/each}}
            </span>
        </span>
    </div>
{{/each}}

</div>
`;

const SETTINGS: Settings = {
    id: 'en-eijiro',
    name: 'English (英辞郎)',
    languageCode: 'eng',
    tokenizeByWhiteSpace: true,
    dictionaries: [
        {
            name: '英辞郎 on the WEB',
            pattern: 'https://eow.alc.co.jp/search?q={}',
        },
        {
            name: 'Weblio辞書',
            pattern: 'https://ejje.weblio.jp/content/{}',
        },
        {
            name: 'The Free Dictionary',
            pattern: 'https://www.thefreedictionary.com/{}',
        },
        {
            name: 'Wiktionary',
            pattern: 'https://en.wiktionary.org/wiki/{}',
        },
        {
            name: 'Dictionary.com',
            pattern: 'https://www.dictionary.com/browse/{}',
        }
    ],
    showDictionary: 'unknown-or-marked',
    template: TEMPLATE,
};

export async function loadEijiro(eijiroContent: Promise<string>, inflectionContent: Promise<string>, frequencyContent: Promise<string>, whitelistContent: Promise<string>, chunkSize: number, progressFn: (progress: number, msg: string) => void) {
    progressFn(0, `Loading inflection patterns...`);
    const inflection = loadInflection(await inflectionContent);

    progressFn(.05, `Loading frequency list...`);
    const frequency = loadFrequency(await frequencyContent);

    progressFn(.10, `Loading whitelist...`);
    const whitelist = loadWhitelist(await whitelistContent);

    progressFn(.15, `Loading EIJIRO...`);
    const lines = (await eijiroContent).split('\r\n');

    const entries = new Map<string, { pos: string | null, defStr: MarkedString }[]>();
    const infos = new Map<string, MarkedString>();
    for (let i = 0; i < lines.length; i++) {
        if (i % 10000 === 0) {
            const p = .2 + (.85 - .2) * i / lines.length;
            progressFn(p, `Parsing EIJIRO... ${Math.ceil(i / lines.length * 100)}% done.`);
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

    progressFn(.85, `Building lemmatizer...`);
    const lemmatizer = buildLemmatizer(dict, inflection);

    progressFn(.90, `Building trie...`);
    const trie = buildTrie(dict, lemmatizer);

    progressFn(.95, `Building dictionary...`);
    const { index, dictionaryChunks, freqs } = buildDictionaryAndFrequency(
        dict, lemmatizer, frequency, chunkSize);

    progressFn(1., `Done.`);

    return { lemmatizer, trie, index, dictionaryChunks, freqs, settings: SETTINGS };
}
