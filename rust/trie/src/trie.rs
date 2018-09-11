#[derive(Debug)]
pub struct Trie<T> {
    base: Vec<u8>,
    check: Vec<i8>, // -1 represents that the parent does not exist
    values: Vec<Option<T>>,
    size: usize, // number of nodes
}

pub type Key = Vec<u8>;

impl<T> Trie<T> {
    pub fn new() -> Trie<T> {
        Trie {
            base: vec![0],
            check: vec![-1],
            values: vec![None],
            size: 1,
        }
    }

    pub fn n_keys(&self) -> usize {
        self.size
    }

    pub fn n_nodes(&self) -> usize {
        self.size
    }

    pub fn insert(&mut self, key: &Key, value: T) {}
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resize() {
        assert!(false);
    }

    #[test]
    fn test() {
        let mut trie = Trie::<i32>::new();
        assert_eq!(trie.n_nodes(), 1);
        assert_eq!(trie.n_keys(), 0);

        trie.insert(&vec![2, 3, 4], 42);
        assert_eq!(trie.n_nodes(), 4);
        assert_eq!(trie.n_keys(), 1);

        trie.insert(&vec![2, 3, 5], 385);
        assert_eq!(trie.n_nodes(), 5);
        assert_eq!(trie.n_keys(), 2);

        trie.insert(&vec![3, 3, 5], 61);
        assert_eq!(trie.n_nodes(), 8);
        assert_eq!(trie.n_keys(), 3);

        trie.insert(&vec![3, 4, 1, 2], -5);
        assert_eq!(trie.n_nodes(), 11);
        assert_eq!(trie.n_keys(), 4);
    }

    #[test]
    fn test_delete() {
        assert!(false);
    }

    #[test]
    fn test_search() {
        assert!(false);
    }

    #[test]
    fn test_serialize() {
        assert!(false);
    }
}
