use std;

#[derive(Clone, Copy, Debug)]
struct Node<T: Copy> {
    base: usize,
    check: usize,
    value: Option<T>,
}

const NO_PARENT: usize = std::usize::MAX;

impl<T> Node<T>
where
    T: Copy,
{
    pub fn new() -> Node<T> {
        Node {
            base: 0, // TODO: is it OK to initialize base with 0?
            check: NO_PARENT,
            value: None,
        }
    }
}

#[derive(Debug)]
pub struct Trie<T: Copy> {
    nodes: Vec<Node<T>>,
    n_keys: usize,
}

pub type Key = Vec<u8>;
const ROOT: usize = 0;

fn add_offset(base: usize, c: u8) -> usize {
    base + c as usize
}

impl<T> Trie<T>
where
    T: Copy,
{
    pub fn new() -> Trie<T> {
        Trie {
            nodes: vec![Node {
                base: 0,
                check: NO_PARENT,
                value: None,
            }],
            n_keys: 0,
        }
    }

    pub fn n_keys(&self) -> usize {
        self.n_keys
    }

    pub fn n_nodes(&self) -> usize {
        let n_child_nodes: usize = self
            .nodes
            .iter()
            .map(|&n| (n.check != NO_PARENT) as usize)
            .sum();
        return n_child_nodes + 1; // add one for root node
    }

    fn transition(&self, from: usize, c: u8) -> usize {
        add_offset(self.nodes[from].base, c)
    }

    fn transition_and_grow(&mut self, from: usize, c: u8) -> usize {
        let to = self.transition(from, c);
        self.grow(to);
        to
    }

    fn grow(&mut self, idx: usize) {
        if self.nodes.len() <= idx {
            // grow sizes of vectors to the power of 2 larger larger than 'idx'
            let mut new_size = 1 << 4;
            while new_size <= idx {
                new_size <<= 1;
            }

            self.nodes.resize(new_size, Node::new());
        }
    }

    fn child(&self, from: usize, c: u8) -> Option<usize> {
        let to = self.transition(from, c);
        if to < self.nodes.len() && self.nodes[to].check == from {
            Some(to)
        } else {
            None
        }
    }

    fn relocate_base(&mut self, node: usize, characters: &[u8], new_base: usize) {
        for &c in characters {
            // copy 'old_to' to 'new_to'
            let old_to = self.transition(node, c);
            let new_to = add_offset(new_base, c);
            assert!(self.nodes[new_to].check == NO_PARENT);
            assert!(self.nodes[old_to].check == node);
            self.nodes[new_to] = self.nodes[old_to];

            // fix check of grand-children nodes
            for d in self.get_characters(old_to) {
                let old_to_to = self.transition(old_to, d);
                self.nodes[old_to_to].check = new_to
            }

            // release old child
            self.nodes[old_to] = Node::new();
        }

        // fix base of 'node'
        self.nodes[node].base = new_base;
    }

    fn get_characters(&mut self, node: usize) -> Vec<u8> {
        let mut characters = vec![];
        for i in 0..256 {
            let c = i as u8;
            let to = self.transition_and_grow(node, c);
            if self.nodes[to].check == node {
                characters.push(c);
            }
        }
        characters
    }

    fn get_available_base(&mut self, characters: &[u8]) -> usize {
        let mut base: usize = 0;
        loop {
            // TODO: refactor this
            let mut ok = true;
            for &c in characters {
                let to = add_offset(base, c);
                self.grow(to);
                if self.nodes[to].check != NO_PARENT {
                    ok = false;
                    break;
                }
            }
            if ok {
                break;
            }
            base += 1;
        }
        base
    }

    fn create_node(&mut self, from: usize, c: u8) -> usize {
        let mut to = self.transition_and_grow(from, c);
        if self.nodes[to].check != NO_PARENT {
            // relocate 'from' to a new available node
            let mut new_characters = self.get_characters(from);
            new_characters.push(c);
            let old_characters = &new_characters[..(new_characters.len() - 1)];
            let new_base = self.get_available_base(&new_characters);
            self.relocate_base(from, old_characters, new_base);

            to = add_offset(new_base, c);
        }
        self.nodes[to].check = from;
        to
    }

    pub fn update(&mut self, key: &Key, value: T) {
        let mut node = ROOT;
        for &c in key.iter() {
            node = match self.child(node, c) {
                Some(to) => to,
                None => self.create_node(node, c),
            };
        }

        // set a new value
        if self.nodes[node].value.is_none() {
            self.n_keys += 1;
        }
        self.nodes[node].value = Some(value);
    }

    pub fn search(&self, key: &Key) -> Option<T> {
        let mut node = ROOT;
        for &c in key.iter() {
            match self.child(node, c) {
                Some(to) => node = to,
                None => return None,
            }
        }
        self.nodes[node].value
    }

    pub fn delete(&mut self, key: &Key) -> bool {
        let mut node = ROOT;
        for &c in key.iter() {
            match self.child(node, c) {
                Some(to) => node = to,
                None => return false,
            }
        }
        match self.nodes[node].value {
            Some(_) => {
                self.nodes[node].value = None;
                self.n_keys -= 1;
                true
            }
            None => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_trie() -> Trie<i32> {
        let mut trie = Trie::<i32>::new();
        trie.update(&vec![2, 3, 4], 42);
        trie.update(&vec![2, 3, 5], 385);
        trie.update(&vec![2, 3, 5], -100);
        trie.update(&vec![3, 3, 5], 61);
        trie.update(&vec![3, 4, 1, 2], -5);
        trie
    }

    #[test]
    fn test_delete() {
        let mut trie = make_trie();
        assert_eq!(trie.delete(&vec![3, 4, 1]), false);
        assert_eq!(trie.delete(&vec![3, 4, 1, 2, 5]), false);
        assert_eq!(trie.delete(&vec![3, 4, 1, 2]), true);
        assert_eq!(trie.delete(&vec![3, 4, 1, 2]), false);
        assert_eq!(trie.delete(&vec![3]), false);
        assert_eq!(trie.delete(&vec![3, 3, 5]), true);
        assert_eq!(trie.delete(&vec![3, 3, 5]), false);
    }

    #[test]
    fn test_search() {
        let trie = make_trie();
        assert_eq!(trie.search(&vec![]), None);
        assert_eq!(trie.search(&vec![2]), None);
        assert_eq!(trie.search(&vec![2, 3, 4, 5]), None);
        assert_eq!(trie.search(&vec![2, 3, 4]), Some(42));
        assert_eq!(trie.search(&vec![2, 3, 5]), Some(-100));
        assert_eq!(trie.search(&vec![3, 3]), None);
        assert_eq!(trie.search(&vec![3, 3, 5, 6]), None);
        assert_eq!(trie.search(&vec![3, 3, 5]), Some(61));
        assert_eq!(trie.search(&vec![3, 4, 1, 2]), Some(-5));
    }

    #[test]
    fn test_update_delete() {
        assert!(false);
    }

    #[test]
    fn test_counts() {
        let mut trie = Trie::<i32>::new();
        assert_eq!(trie.n_nodes(), 1);
        assert_eq!(trie.n_keys(), 0);

        let k1 = vec![2, 3, 4];
        trie.update(&k1, 42);
        assert_eq!(trie.n_nodes(), 4);
        assert_eq!(trie.n_keys(), 1);

        let k2 = vec![2, 3, 5];
        trie.update(&k2, 385);
        assert_eq!(trie.n_nodes(), 5);
        assert_eq!(trie.n_keys(), 2);

        // duplicate key
        trie.update(&k2, -100);
        assert_eq!(trie.n_nodes(), 5);
        assert_eq!(trie.n_keys(), 2);

        let k3 = vec![3, 3, 5];
        trie.update(&k3, 61);
        assert_eq!(trie.n_nodes(), 8);
        assert_eq!(trie.n_keys(), 3);

        let k4 = vec![3, 4, 1, 2];
        trie.update(&k4, -5);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 4);

        trie.delete(&k1);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 3);

        trie.delete(&k3);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 2);

        trie.delete(&k4);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 1);

        trie.delete(&k1);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 1);

        trie.delete(&k2);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 0);

        trie.delete(&k4);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 0);
    }

    #[test]
    fn test_serialize() {
        assert!(false);
    }
}
