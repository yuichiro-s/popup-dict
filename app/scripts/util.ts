export function createNodeFromString(str: string): HTMLElement {
  let parser = new DOMParser();
  let node = parser.parseFromString(str, 'text/html');
  return node.body;
}

/**
 * Get the next leaf node.
 */
export function getNextLeaf(node: Node, previous = false) {
  let node_: Node | null = node;
  while (node_ && !(previous ? node_.previousSibling : node_.nextSibling)) {
    node_ = node_.parentElement;
  }
  if (!node_) return null;
  node_ = previous ? node_.previousSibling : node_.nextSibling;
  let getChild = (node: Node) => previous ? node.lastChild : node.firstChild;
  while (node_ && getChild(node_)) {
    node_ = getChild(node_);
  }
  return node_;
}

