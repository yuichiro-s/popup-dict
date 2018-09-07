import 'chromereload/devonly';
import { hidePopup, isInsidePopup, setPopupPosision, showPopup } from './popupDialog';
import { getNextLeaf } from './util';
import { removeSelection, updateSelection } from './selection';
import { SearchResults } from './search';
import { isWordBoundary } from './word';
import { sendCommand } from './command';

let eventListeners: { [index: string]: EventListenerOrEventListenerObject[] } = {};

function registerEventListener(type: string, listener: EventListenerOrEventListenerObject) {
  if (!(type in eventListeners)) {
    eventListeners[type] = [];
  }
  eventListeners[type].push(listener);
}

function findPreviousBeginningOfWord(node: Node, offset: number): [Node, number] {
  while (true) {
    let prevNode = getNextLeaf(node, true);

    let currentText = node.textContent;
    if (!currentText) throw new Error('Null text encountered.');

    let queryString = currentText;
    let queryOffset = offset;
    if (prevNode && prevNode.nodeType === Node.TEXT_NODE) {
      let prevText = prevNode.textContent;
      if (!prevText) throw new Error('Null text encountered.');
      // prepend previous text
      queryString = prevText + queryString;
      queryOffset += prevText.length;
    }

    if (isWordBoundary(queryString, queryOffset)) {
      // beginning of word reached
      break;
    } else {
      if (offset > 0) {
        offset--;
      } else {
        if (prevNode === null) throw new Error('Null node encountered.');
        let prevText = prevNode.textContent;
        if (!prevText) throw new Error('Null text encountered.');
        node = prevNode;
        offset = prevText.length;
      }
    }
  }

  return [node, offset];
}

/**
 * Extract text snippet from the node starting at the offset
 */
function extractTextSnippet(node: Node, offset: number, maxLength: number) {
  let text = '';
  let node_: Node | null = node;
  while (node_ && text.length < offset + maxLength) {
    text += node_.textContent;
    node_ = getNextLeaf(node_);
  }
  return text.substring(offset, offset + maxLength);
}

function NoResults() {
  hidePopup();
  removeSelection();
}

const MAX_LENGTH = 30;
let lastQuery: string = '';

function mouseMoveListener(e: MouseEvent) {
  if (isMouseDragged()) {
    // don't do anything while dragging
    return;
  }

  let x = e.clientX;
  let y = e.clientY;

  // get node where mouse is on
  let range = document.caretRangeFromPoint(x, y);
  if (!range) {
    return;
  }
  let textNode = range.startContainer;
  let offset = range.startOffset;

  // don't do anything if Alt is pressed down or mouse is already inside popup
  if (isAltDown() || isInsidePopup(x, y)) {
    return;
  }

  if (!textNode || textNode.nodeType !== textNode.TEXT_NODE) {
    // text node is selected
    NoResults();
  } else {
    // change position of the popup dialog
    let popupX = Math.min(x, window.innerWidth - 300);
    let popupY = y + 30;
    setPopupPosision(popupX, popupY);

    // move cursor backwards until reaching beginning-of-word
    [textNode, offset] = findPreviousBeginningOfWord(textNode, offset);

    let query = extractTextSnippet(textNode, offset, MAX_LENGTH);

    if (!query || query[0].trim().length === 0) {
      // white space is selected
      NoResults();
    } else {
      if (query !== lastQuery) {
        sendCommand({
          'type': 'search',
          'query': query
        }, (response: SearchResults) => {
          if (response.entries.length === 0) {
            NoResults();
          } else {
            showPopup(response.entries);
            updateSelection(textNode, offset, response.matchLength);
          }
        });
      }
      lastQuery = query;
    }
  }
}

registerEventListener('mousemove', mouseMoveListener);

/**
 * Keep track of whether the Alt key is pressed.
 */
let alt = false;
let checkIsAltDown = (e: KeyboardEvent) => {
  alt = e.altKey;
};

registerEventListener('keydown', checkIsAltDown);
registerEventListener('keyup', checkIsAltDown);
registerEventListener('mousemove', checkIsAltDown);

function isAltDown() {
  return alt;
}

/**
 * Keep track of whether the mouse is being dragged.
 */
let dragging = false;

registerEventListener('mouseup', (e: MouseEvent) => { dragging = false; });
registerEventListener('mousedown', (e: MouseEvent) => { dragging = true; });

function isMouseDragged() {
  return dragging;
}

export function addEventListeners() {
  for (let type in eventListeners) {
    for (let listener of eventListeners[type]) {
      document.addEventListener(type, listener);
    }
  }
}

export function removeEventListeners() {
  for (let type in eventListeners) {
    for (let listener of eventListeners[type]) {
      document.removeEventListener(type, listener);
    }
  }
}