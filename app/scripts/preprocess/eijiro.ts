import { Settings } from '../common/package';
import { Progress } from '../common/importer';
import { Lemmatizer } from '../common/lemmatizer';
import { TrieNode } from '../common/trie';
import { Index, Dictionary } from '../common/dictionary';
import { FrequencyTable } from '../common/frequency';

export const PKG_ID = 'en-eijiro';

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
    id: PKG_ID,
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

export type MarkedString = (string | [string])[];

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

interface Eijiro {
    lemmatizer: Lemmatizer;
    trie: TrieNode;
    index: Index;
    dictionaryChunks: Map<number, Dictionary>;
    freqs: FrequencyTable;
}

interface LoadEijiroResult extends Eijiro {
    settings: Settings;
}

export type EijiroImporterMessage = {
    type: 'progress',
    progress: Progress,
} | { type: 'done' } & Eijiro;

export function loadEijiro(
    eijiroURL: string,
    inflectionURL: string,
    frequencyURL: string,
    whitelistURL: string,
    chunkSize: number,
    progressFn: (progress: Progress) => void): Promise<LoadEijiroResult> {
    return new Promise(resolve => {
        const worker = new Worker('./scripts/eijiro.worker.js');
        worker.onmessage = (msg) => {
            const data: EijiroImporterMessage = msg.data;
            if (data.type === 'progress') {
                progressFn(data.progress);
            } else {
                resolve({
                    lemmatizer: data.lemmatizer,
                    trie: data.trie,
                    index: data.index,
                    dictionaryChunks: data.dictionaryChunks,
                    freqs: data.freqs,
                    settings: SETTINGS,
                });
            }
        };
        worker.postMessage({
            eijiroURL,
            inflectionURL,
            frequencyURL,
            whitelistURL,
            chunkSize,
        });
    });
}
