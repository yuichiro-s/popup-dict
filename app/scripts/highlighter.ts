import { State } from './entry';
import { Span } from './trie';
import { tokenize, Token } from './tokenizer';
import { sendCommand } from './command';
import { Language, CHINESE, CHINESE_HANZI } from './languages';
import { getLanguage } from './language';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/dist/themes/light-border.css';
import tippy from 'tippy.js';
import { createToolTip, CLASS_POPUP_DICTIONARY } from './tooltip';

const PUNCTUATIONS = [
  '\n',
  '.',
  '!',
  '?',
  ';',
  '。',
  '．',
];

const HIGHLIGHTED_CLASS = 'vocab-highlighted';

// tags to search for matches
const TAG_LIST = [
  'P', 'A', 'B', 'I', 'STRONG', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI',
  'TD', 'DD', 'SPAN', 'DIV', 'BLOCKQUOTE', 'SECTION',
];

let currentSpanNode: HTMLElement | null = null;

function mouseEnterListener(event: MouseEvent) {
  let element = <HTMLElement>event.target;
  currentSpanNode = element;
  tippy.hideAllPoppers();

  // look up dictionary
  let key = element.dataset.key!;
  let lang = getLanguage();
  sendCommand({
    type: 'lookup-dictionary',
    lang,
    keys: [key]
  }).then(dictEntries => {
    let dictEntry = dictEntries[0];
    if (dictEntry && dictEntry.defs && dictEntry.lemmas) {
      // show tooltip
      let toolTip = createToolTip(dictEntry);
      tippy.one(element, {
        theme: 'light-border',
        content: toolTip,
        allowHTML: true,
        delay: [0, 0],
        duration: [0, 0],
      }).show();
    }
  });
}

function mouseLeaveListener() {
  currentSpanNode = null;
}

function makeHighlightSpan(span: Span, text: string) {
  let spanNode = document.createElement('span');
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
  e.dataset.state = State[state].toLowerCase();
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

function enumerateTextNodes(root: Element, lang: Language) {
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
              if (lang === CHINESE_HANZI || text.trim().length > 1) {
                // allow single character when the language is Chinese
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
  let lang: Language = getLanguage();

  if (root === undefined) root = document.body;
  let textNodes = enumerateTextNodes(root, lang);
  let { tokensBatch, lemmasBatch } = await lemmatizeBatch(lang, textNodes);

  // TODO: allow for multilple lemmas
  let spansBatch = await sendCommand({
    type: 'search-all-batch',
    lang,
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

async function lemmatizeBatch(lang: Language, textNodes: Node[]) {
  let tokensBatch = [];
  let tokensList = [];
  let boundaries = [0];
  let cursor = 0;
  for (let textNode of textNodes) {
    let text = textNode.textContent!;
    let tokens = tokenize(text, lang);
    tokensList.push(tokens);
    tokensBatch.push(...tokens);
    cursor += tokens.length;
    boundaries.push(cursor);
  }
  let lemmasBatch: string[] = await sendCommand({
    type: 'lemmatize',
    tokens: tokensBatch.map((tok) => tok.form),
    lang,
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

async function getSpanEntry(lang: Language, node: HTMLElement) {
  let key = node.dataset.key!.split(' ');
  let entry = await sendCommand({ type: 'search', lang, key });
  // TODO: when is entry undefined?
  return entry;
}

export async function toggle(lang: Language, newState: State) {
  if (currentSpanNode !== null) {
    let node = currentSpanNode;
    let entry = await getSpanEntry(lang, node);
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
          if (lang === CHINESE) {
            pattern = new RegExp(form);
          } else {
            pattern = new RegExp('\\b' + form + '\\b');
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
  let lang = getLanguage();
  let selection = window.getSelection();
  let done = false;
  if (selection) {
    let elements = document.getElementsByClassName(HIGHLIGHTED_CLASS);
    let entries = [];
    for (let i = 0; i < elements.length; i++) {
      let element = <HTMLElement>elements[i];
      if (selection.containsNode(element, true)) {
        let entry = await getSpanEntry(lang, element);
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
    await toggle(lang, State.Known);
  }
}

export async function toggleMarked() {
  let lang = getLanguage();
  await toggle(lang, State.Marked);
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

let timer: any = null;
let scrollListener = (event: Event) => {
  if (timer !== null) {
    window.clearTimeout(timer);
  }
  timer = setTimeout(() => {
    highlight();
  }, 150);
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
    if (!element.classList.contains(HIGHLIGHTED_CLASS) && !insideTooltip(element)) {
      highlight(element);
    }
  });
});
