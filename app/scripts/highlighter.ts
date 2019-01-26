import { State } from './entry';
import { Span } from './trie';
import { tokenize, Token } from './tokenizer';
import { sendCommand } from './command';
import { PackageID } from './packages';
import { getPackage } from './package';
import { createToolTip, CLASS_POPUP_DICTIONARY } from './tooltip';
import { Settings } from './settings';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/dist/themes/light-border.css';
import tippy from 'tippy.js';
import debounce from 'lodash/debounce';

const PUNCTUATIONS = [
    '\n',
    '.',
    '!',
    '?',
    ';',
    '。',
    '．',
];

const HIGHLIGHT_TAG = 'highlighted';

const HIGHLIGHTED_CLASS = 'vocab-highlighted';

// tags to search for matches
const TAG_LIST = [
    'P', 'A', 'B', 'I', 'STRONG', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI',
    'TD', 'DD', 'SPAN', 'DIV', 'BLOCKQUOTE', 'SECTION', 'PRE',
];

let currentSpanNode: HTMLElement | null = null;

function stateToString(state: State) {
    return State[state].toLowerCase();
}

function stringToState(str: string) {
    let state: State;
    switch (str) {
        case 'unknown': { state = State.Unknown; break; }
        case 'known': { state = State.Known; break; }
        case 'marked': { state = State.Marked; break; }
        default: { throw Error(`Unknown state: ${str}`); }
    }
    return state;
}

function isTooltipEnabled(pkg: Settings | null, state: State) {
    if (pkg) {
        if (pkg.showDictionary === 'always') {
            return true;
        } else if (pkg.showDictionary === 'never') {
            return false;
        } else {
            // pkg.showDictionary === 'unknown-or-marked'
            return state !== State.Known;
        }
    } else {
        // TODO: can pkg be none?
        return true;
    }
}

async function mouseEnterListener(event: MouseEvent) {
    let element = <HTMLElement>event.target;
    currentSpanNode = element;
    tippy.hideAllPoppers();

    // look up dictionary
    let pkg = await getPackage();
    if (isTooltipEnabled(pkg, stringToState(element.dataset.state!))) {
        let key = element.dataset.key!;
        if (pkg) {
            let dictEntries = await sendCommand({ type: 'lookup-dictionary', pkgId: pkg.id, keys: [key] });
            let dictEntry = dictEntries[0];
            if (dictEntry && dictEntry.defs && dictEntry.lemmas) {
                // show tooltip
                let toolTip = createToolTip(dictEntry);
                let tip = tippy.one(element, {
                    theme: 'light-border',
                    content: toolTip,
                    allowHTML: true,
                    delay: [0, 0],
                    duration: [0, 0],
                    arrow: true,
                    size: 'small',
                    interactive: false,
                });
                if (tip) {
                    tip.show();
                }
            }
        }
    }
}

function mouseLeaveListener() {
    currentSpanNode = null;
}

function makeHighlightSpan(span: Span, text: string) {
    let spanNode = document.createElement(HIGHLIGHT_TAG);
    setSpanClass(spanNode, span.entry.state);
    spanNode.addEventListener('mouseenter', mouseEnterListener);
    spanNode.addEventListener('mouseleave', mouseLeaveListener);
    spanNode.dataset.key = span.key.join(' ');
    spanNode.textContent = text;
    return spanNode;
}

function replaceTextWithSpans(textNode: Node, tokens: Token[], spans: Span[]) {
    let parentNode = textNode.parentNode!;
    if (!parentNode) return;  // TODO: is this necessary?
    let text = textNode.textContent!;

    function insert(newNode: Node) {
        parentNode.insertBefore(newNode, textNode);
    }

    function insertText(begin: number, end: number) {
        let s = text.substring(begin, end);
        let newNode = document.createTextNode(s);
        insert(newNode);
    }

    let cursor = 0;
    for (const span of spans) {
        let begin = tokens[span.begin].begin;
        let end = tokens[span.end - 1].end;
        let spanText = text.substring(begin, end);
        if (cursor < begin) {
            insertText(cursor, begin);
        }
        let spanNode = makeHighlightSpan(span, spanText);
        insert(spanNode);
        cursor = end;
    }
    if (cursor < text.length) {
        insertText(cursor, text.length);
    }

    parentNode.removeChild(textNode);
}

function setSpanClass(e: HTMLElement, state: State) {
    e.classList.add(HIGHLIGHTED_CLASS);
    e.dataset.state = stateToString(state);
}

function unhighlight(root?: Element) {
    if (root === undefined) root = document.body;

    let elements = root.getElementsByClassName(HIGHLIGHTED_CLASS);
    let i = elements.length;
    while (i--) {
        let element = elements[i];
        let parentNode = element.parentNode;
        let text = element.textContent;
        if (text && parentNode) {
            let newNode = document.createTextNode(text);
            parentNode.insertBefore(newNode, element);
            parentNode.removeChild(element);
        }
    }

    root.normalize();
}

function enumerateTextNodes(root: Element, pkg: Settings) {
    let nodes: Node[] = [];
    function process(element: Element) {
        let rect = element.getBoundingClientRect();
        let h = window.innerHeight || document.documentElement!.clientHeight;
        if (rect.bottom >= 0 && rect.top <= h) {
            if (TAG_LIST.includes(element.nodeName) && !element.classList.contains(HIGHLIGHTED_CLASS)) {
                let children = Array.from(element.childNodes);
                for (let j = 0; j < children.length; j++) {
                    let child = children[j];
                    if (child.nodeType === 3) {
                        // text node
                        let text = child.textContent;
                        if (text) {
                            if (!pkg.tokenizeByWhiteSpace || text.trim().length > 1) {
                                nodes.push(child);
                            }
                        }
                    }
                }
            }
        }
    }
    function dfs(element: Element) {
        if (!element.classList.contains(CLASS_POPUP_DICTIONARY)) {
            // exclude content of popup
            for (let i = 0; i < element.children.length; i++) {
                dfs(element.children[i]);
            }
            process(element);
        }
    }
    dfs(root);
    return nodes;
}

async function highlight(root?: Element) {
    let pkg: Settings | null = await getPackage();
    if (pkg) {
        if (root === undefined) root = document.body;
        let textNodes = enumerateTextNodes(root, pkg);
        let { tokensBatch, lemmasBatch } = await lemmatizeBatch(textNodes, pkg);

        // TODO: allow for multilple lemmas
        let spansBatch = await sendCommand({
            type: 'search-all-batch',
            pkgId: pkg.id,
            lemmasBatch,
        });

        let modification = [];
        for (let i = 0; i < lemmasBatch.length; i++) {
            let textNode = textNodes[i];
            let tokens = tokensBatch[i];
            let spans = spansBatch[i];
            if (spans.length > 0) {
                // match found
                modification.push([textNode, tokens, spans]);
            }
        }

        for (const [node, tokens, spans] of modification) {
            replaceTextWithSpans(node, tokens, spans);
        }
    }
}

const highlightDebounced = debounce(highlight, 150);

async function lemmatizeBatch(textNodes: Node[], pkg: Settings) {
    let tokensBatch = [];
    let tokensList = [];
    let boundaries = [0];
    let cursor = 0;
    for (let textNode of textNodes) {
        let text = textNode.textContent!;
        let tokens = tokenize(text, pkg.tokenizeByWhiteSpace);
        tokensList.push(tokens);
        tokensBatch.push(...tokens);
        cursor += tokens.length;
        boundaries.push(cursor);
    }
    let lemmasBatch: string[] = await sendCommand({
        type: 'lemmatize',
        tokens: tokensBatch.map((tok) => tok.form),
        pkgId: pkg.id,
    });
    let lemmasList: string[][] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
        let lemmas = lemmasBatch.slice(boundaries[i], boundaries[i + 1]);
        lemmasList.push(lemmas);
    }
    return {
        tokensBatch: tokensList,
        lemmasBatch: lemmasList,
    };
}

async function rehighlight(keys: string[], state: State) {
    let root = document.body;
    let elements = root.getElementsByClassName(HIGHLIGHTED_CLASS);
    for (let i = 0; i < elements.length; i++) {
        let element = <HTMLElement>elements[i];
        for (let j = 0; j < keys.length; j++) {
            if (element.dataset.key === keys[j]) {
                setSpanClass(element, state);
                break;
            }
        }
    }
}

async function getSpanEntry(pkgId: PackageID, node: HTMLElement) {
    let key = node.dataset.key!.split(' ');
    let entry = await sendCommand({ type: 'search', pkgId, key });
    // TODO: when is entry undefined?
    return entry;
}

export async function toggle(pkg: Settings, newState: State) {
    if (currentSpanNode !== null) {
        let node = currentSpanNode;
        let entry = await getSpanEntry(pkg.id, node);
        let tab = await sendCommand({ type: 'get-tab' });
        if (entry) {
            let currentState = entry.state;
            if (currentState === newState) {
                entry.state = State.Unknown;
            } else {
                if (node.parentElement && node.parentElement.textContent) {
                    let form = node.textContent!;
                    let text = node.parentElement.textContent;
                    let pattern;
                    if (pkg.tokenizeByWhiteSpace) {
                        pattern = new RegExp('\\b' + form + '\\b');
                    } else {
                        pattern = new RegExp(form);
                    }
                    let begin = text.search(pattern);
                    let end = begin + form.length;
                    let textBegin = begin;
                    let textEnd = end;
                    while (textBegin > 0) {
                        if (PUNCTUATIONS.includes(text[textBegin - 1])) {
                            break;
                        }
                        textBegin--;
                    }
                    while (textEnd < text.length) {
                        if (PUNCTUATIONS.includes(text[textEnd - 1])) {
                            break;
                        }
                        textEnd++;
                    }
                    entry.context = {
                        text: text.slice(textBegin, textEnd),
                        begin: begin - textBegin,
                        end: end - textBegin,
                    };
                }
                entry.state = newState;
                entry.date = Date.now();
                entry.source = {
                    url: tab.url,
                    title: tab.title,
                };
            }
            if (entry.state !== State.Marked) {
                delete entry.source;
                delete entry.context;
            }
            await sendCommand({ type: 'update-entry', entry });
            rehighlight([entry.key], entry.state);
        }
    }
}

export async function toggleKnown() {
    let pkg = await getPackage();
    if (pkg) {
        let selection = window.getSelection();
        let done = false;
        if (selection) {
            let elements = document.getElementsByClassName(HIGHLIGHTED_CLASS);
            let entries = [];
            for (let i = 0; i < elements.length; i++) {
                let element = <HTMLElement>elements[i];
                if (selection.containsNode(element, true)) {
                    let entry = await getSpanEntry(pkg.id, element);
                    if (entry && entry.state === State.Unknown) {
                        entries.push(entry);
                    }
                }
            }
            if (entries.length > 0) {
                let keys = [];
                for (let entry of entries) {
                    entry.state = State.Known;
                    keys.push(entry.key);
                    await sendCommand({ type: 'update-entry', entry });
                }
                rehighlight(keys, State.Known);
                done = true;
            }
        }
        if (!done) {
            await toggle(pkg, State.Known);
        }
    }
}

export async function toggleMarked() {
    let pkg = await getPackage();
    if (pkg) {
        await toggle(pkg, State.Marked);
    }
}

export async function enable() {
    highlight();

    observer.observe(document.body, {
        childList: true, subtree: true, characterData: true,
    });

    window.addEventListener('scroll', scrollListener);
}

export function disable() {
    observer.disconnect();
    window.removeEventListener('scroll', scrollListener);
    unhighlight();
}

let scrollListener = (event: Event) => {
    highlightDebounced();
};

function insideTooltip(originalElement: Element) {
    // recursively check if the node is inside the tooltip
    let element: Element | null = originalElement;
    while (element) {
        if (element.classList.contains(CLASS_POPUP_DICTIONARY)) {
            return true;
        }
        element = element.parentElement;
    }
    return false;
}

let observer = new MutationObserver(async (records: MutationRecord[]) => {
    // enumerate all newly added nodes
    let addedNodes = new Set();
    for (const record of records) {
        record.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.TEXT_NODE) {
                addedNodes.add(node);
            }
        });
    }

    // run highlighter on the newly added nodes
    addedNodes.forEach(element => {
        if (element.classList && !element.classList.contains(HIGHLIGHTED_CLASS) && !insideTooltip(element)) {
            highlight(element);
        }
    });
});
