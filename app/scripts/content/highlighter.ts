import { debounce } from "lodash-es";
import tippy, { Instance } from "tippy.js";
import "tippy.js/themes/light-border.css";

import { IDictionaryItem } from "../common/dictionary";
import { State } from "../common/entry";
import { IPackage, PackageID } from "../common/package";
import { ISpan } from "../common/search";
import { IToken, tokenize } from "../common/tokenizer";
import { sendCommand } from "./command";
import { getPackage } from "./package";
import { applyStyle, removeStyle } from "./style";
import { CLASS_POPUP_DICTIONARY, createToolTip } from "./tooltip";

import "../../styles/highlighter.scss";

const PUNCTUATIONS = [
    "\n",
    ".",
    "!",
    "?",
    ";",
    "。",
    "．",
];

export const HIGHLIGHT_TAG = "HLTR";

// tags to search for matches
const TAG_LIST = [
    "P", "A", "B", "I", "STRONG", "EM", "H1", "H2", "H3", "H4", "H5", "H6", "LI",
    "TD", "DD", "SPAN", "DIV", "BLOCKQUOTE", "SECTION", "PRE",
];

let currentSpanNode: HTMLElement | null = null;

export function stateToString(state: State) {
    return State[state].toLowerCase();
}

function stringToState(str: string) {
    let state: State;
    switch (str) {
        case "unknown": { state = State.Unknown; break; }
        case "known": { state = State.Known; break; }
        case "marked": { state = State.Marked; break; }
        default: { throw Error(`Unknown state: ${str}`); }
    }
    return state;
}

function isTooltipEnabled(pkg: IPackage | null, state: State) {
    if (pkg) {
        if (pkg.showDictionary === "always") {
            return true;
        } else if (pkg.showDictionary === "never") {
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
    const element = event.target as HTMLElement;
    currentSpanNode = element;
    tippy.hideAll();

    // look up dictionary
    const pkg = await getPackage();
    if (isTooltipEnabled(pkg, stringToState(element.dataset.state!))) {
        const key = element.dataset.key!;
        if (pkg) {
            const dictEntries = await sendCommand({ type: "lookup-dictionary", pkgId: pkg.id, keys: [key] });
            const dictEntry: IDictionaryItem = dictEntries[0];

            if (dictEntry) {
                // show tooltip
                const toolTip = await createToolTip(pkg.id, dictEntry);
                const t = tippy(element, {
                    theme: "light-border",
                    content: toolTip,
                    allowHTML: true,
                    delay: [0, 0],
                    duration: [0, 0],
                    arrow: true,
                    size: "small",
                    interactive: false,
                }) as Instance;
                if (t) {
                    t.show();
                }
            }
        }
    }
}

function mouseLeaveListener() {
    currentSpanNode = null;
}

function makeHighlightSpan(span: ISpan, text: string) {
    const spanNode = document.createElement(HIGHLIGHT_TAG);
    setSpanClass(spanNode, span.entry.state);
    spanNode.addEventListener("mouseenter", mouseEnterListener);
    spanNode.addEventListener("mouseleave", mouseLeaveListener);
    spanNode.dataset.key = span.key.join(" ");
    spanNode.textContent = text;
    return spanNode;
}

function replaceTextWithSpans(textNode: Node, tokens: IToken[], spans: ISpan[]) {
    const parentNode = textNode.parentNode!;
    if (!parentNode) { return; }  // TODO: is this necessary?
    const text = textNode.textContent!;

    function insert(newNode: Node) {
        parentNode.insertBefore(newNode, textNode);
    }

    function insertText(begin: number, end: number) {
        const s = text.substring(begin, end);
        const newNode = document.createTextNode(s);
        insert(newNode);
    }

    let cursor = 0;
    for (const span of spans) {
        const begin = tokens[span.begin].begin;
        const end = tokens[span.end - 1].end;
        const spanText = text.substring(begin, end);
        if (cursor < begin) {
            insertText(cursor, begin);
        }
        const spanNode = makeHighlightSpan(span, spanText);
        insert(spanNode);
        cursor = end;
    }
    if (cursor < text.length) {
        insertText(cursor, text.length);
    }

    parentNode.removeChild(textNode);
}

function setSpanClass(e: HTMLElement, state: State) {
    e.dataset.state = stateToString(state);
}

function unhighlight(root?: Element) {
    if (root === undefined) { root = document.body; }

    const elements = root.getElementsByTagName(HIGHLIGHT_TAG);
    let i = elements.length;
    while (i--) {
        const element = elements[i];
        const parentNode = element.parentNode;
        const text = element.textContent;
        if (text && parentNode) {
            const newNode = document.createTextNode(text);
            parentNode.insertBefore(newNode, element);
            parentNode.removeChild(element);
        }
    }

    root.normalize();
}

function* enumerateTextNodes(root: Element, pkg: IPackage) {
    const h = window.innerHeight || document.documentElement!.clientHeight;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            if ((style.display === "none") ||
                element.classList.contains(CLASS_POPUP_DICTIONARY)) {
                return NodeFilter.FILTER_REJECT;
            }

            if (
                // don't highlight inside display:flex because spaces around highlights will be ignored
                style.display === "flex" ||

                rect.height === 0
                ) {
                return NodeFilter.FILTER_SKIP;
            }
            if (0 <= rect.bottom && rect.top <= h) {
                if (TAG_LIST.includes(element.tagName)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
            return NodeFilter.FILTER_SKIP;
        },
    });

    let currentElement;
    while (true) {
        currentElement = walker.nextNode();
        if (currentElement === null) { break; }

        const children = Array.from(currentElement.childNodes);
        for (const child of children) {
            if (child.nodeType === 3) {
                // text node
                const text = child.textContent;
                if (text) {
                    if (!pkg.tokenizeByWhiteSpace || text.trim().length > 1) {
                        yield child;
                    }
                }
            }
        }
    }
}

const TIMEOUT = 50;

async function highlightNodes(nodes: Node[], tokensBatch: IToken[][], pkg: IPackage) {

    // TODO: allow for multilple lemmas
    const spansBatch = await sendCommand({
        type: "search-all-batch",
        pkgId: pkg.id,
        tokensBatch: tokensBatch.map((tokens) => tokens.map((tok) => tok.form)),
    });

    const modification = [];
    for (let i = 0; i < tokensBatch.length; i++) {
        const textNode = nodes[i];
        const tokens = tokensBatch[i];
        const spans = spansBatch[i];
        if (spans.length > 0) {
            // match found
            modification.push({ textNode, tokens, spans });
        }
    }

    for (const { textNode, tokens, spans } of modification) {
        replaceTextWithSpans(textNode, tokens, spans);
    }
}

async function highlight(root?: Element) {
    const pkg: IPackage | null = await getPackage();
    if (pkg) {
        if (root === undefined) { root = document.body; }
        const textNodes = enumerateTextNodes(root, pkg);

        const currentNodes: Node[] = [];
        const tokensBatch = [];
        let lastTime = Date.now();
        while (true) {
            const { value: node, done } = textNodes.next();
            if (done) { break; }

            // tokenize
            currentNodes.push(node);
            const text = node.textContent!;
            const tokens = tokenize(text, pkg.tokenizeByWhiteSpace);
            tokensBatch.push(tokens);

            if (Date.now() - lastTime > TIMEOUT) {
                await highlightNodes(currentNodes, tokensBatch, pkg);
                currentNodes.length = 0;
                tokensBatch.length = 0;
                lastTime = Date.now();
            }
        }
        if (currentNodes.length > 0) {
            await highlightNodes(currentNodes, tokensBatch, pkg);
        }
    }
}

const highlightDebounced = debounce(highlight, 150);

async function rehighlight(keys: string[], state: State) {
    const root = document.body;
    const elements = root.getElementsByTagName(HIGHLIGHT_TAG);
    for (const element of elements) {
        for (const key of keys) {
            if (element instanceof HTMLElement) {
                if (element.dataset.key === key) {
                    setSpanClass(element, state);
                    break;
                }
            }
        }
    }
}

async function getSpanEntry(pkgId: PackageID, node: HTMLElement) {
    const key = node.dataset.key!.split(" ");
    const entry = await sendCommand({ type: "search", pkgId, key });
    // TODO: when is entry undefined?
    return entry;
}

export async function toggle(pkg: IPackage, newState: State) {
    if (currentSpanNode !== null) {
        const node = currentSpanNode;
        const entry = await getSpanEntry(pkg.id, node);
        const tab = await sendCommand({ type: "get-tab" });
        if (entry) {
            const currentState = entry.state;
            if (currentState === newState) {
                entry.state = State.Unknown;
            } else {
                if (node.parentElement && node.parentElement.textContent) {
                    const form = node.textContent!;
                    const text = node.parentElement.textContent;
                    let pattern;
                    if (pkg.tokenizeByWhiteSpace) {
                        pattern = new RegExp("\\b" + form + "\\b");
                    } else {
                        pattern = new RegExp(form);
                    }
                    const begin = text.search(pattern);
                    const end = begin + form.length;
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
            await sendCommand({ type: "update-entry", entry });
            rehighlight([entry.key], entry.state);
        }
    }
}

export async function toggleKnown() {
    const pkg = await getPackage();
    if (pkg) {
        const selection = window.getSelection();
        let done = false;
        if (selection) {
            const elements = document.getElementsByTagName(HIGHLIGHT_TAG);
            const entries = [];
            for (const element of elements) {
                if (element instanceof HTMLElement) {
                    if (selection.containsNode(element, true)) {
                        const entry = await getSpanEntry(pkg.id, element);
                        if (entry && entry.state === State.Unknown) {
                            entries.push(entry);
                        }
                    }
                }
            }
            if (entries.length > 0) {
                const keys = [];
                for (const entry of entries) {
                    entry.state = State.Known;
                    keys.push(entry.key);
                    await sendCommand({ type: "update-entry", entry });
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
    const pkg = await getPackage();
    if (pkg) {
        await toggle(pkg, State.Marked);
    }
}

export async function enable() {
    applyStyle();
    highlight();
    window.addEventListener("scroll", scrollListener);
    observer.observe(document.body, {
        childList: true, subtree: true, characterData: true,
    });
}

export function disable() {
    observer.disconnect();
    window.removeEventListener("scroll", scrollListener);
    unhighlight();
    removeStyle();
}

const scrollListener = (event: Event) => {
    highlightDebounced();
};

const observer = new MutationObserver(async (records: MutationRecord[]) => {
    // enumerate all newly added nodes
    const addedNodes = new Set();
    for (const record of records) {
        record.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.TEXT_NODE) {
                addedNodes.add(node);
            }
        });
    }

    // run highlighter on the newly added nodes
    addedNodes.forEach((element) => {
        if (element.tagName !== HIGHLIGHT_TAG) {
            highlight(element);
        }
    });
});
