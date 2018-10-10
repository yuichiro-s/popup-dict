import 'chromereload/devonly';

import {getNextLeaf} from './util';

export function removeSelection() {
  // don't modify selection while dragging
  let selection = document.getSelection()!;
  selection.removeAllRanges();
}

export function updateSelection(node: Node, offset: number, length: number) {
  // don't modify selection while dragging
  let range = document.createRange();
  range.setStart(node, offset);

  let endPos = offset + length;
  let node_: Node | null = node;
  while (node_) {
    let len = node_.textContent ? node_.textContent.length : 0;
    if (endPos <= len) {
      break;
    }
    endPos -= len;
    node_ = getNextLeaf(node_);
  }

  if (node_) {
    range.setEnd(node_, endPos);
    let selection = document.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
