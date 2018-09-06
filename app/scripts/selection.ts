import {getNextLeaf} from './util';

export function removeSelection() {
  // don't modify selection while dragging
  let selection = document.getSelection();
  selection.removeAllRanges();
}

export function updateSelection(node: Node, offset: number, length: number) {
  // don't modify selection while dragging
  let range = document.createRange();
  range.setStart(node, offset);

  let endPos = offset + length;
  let node_: Node | null = node;
  while (node.textContent && endPos > node.textContent.length) {
    endPos -= node.textContent.length;
    node_ = getNextLeaf(node);
  }
  range.setEnd(node, endPos);
  let selection = document.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
