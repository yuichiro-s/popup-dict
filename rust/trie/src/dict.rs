extern crate bincode;
extern crate double_array_trie;
extern crate failure;
extern crate serde;
extern crate snap;

use self::bincode::{deserialize_from, serialize};
use self::double_array_trie::static_trie::Trie;
use std::io::{Read, Write};

#[derive(Debug)]
pub struct SearchResult {
    matched: String,
    entry: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Dictionary {
    trie: Trie<Vec<usize>>,
    entries: Vec<String>,
}

impl Dictionary {
    pub fn new(trie: Trie<Vec<usize>>, entries: Vec<String>) -> Dictionary {
        Dictionary {
            trie: trie,
            entries: entries,
        }
    }
    pub fn search(&self, query: &str) -> Vec<SearchResult> {
        let bytes = query.as_bytes();
        let trie_results = self.trie.prefix_search(&bytes.to_vec());
        let mut results = vec![];
        for (entry_ids, len) in trie_results {
            for entry_id in entry_ids {
                let entry = self.entries.get(entry_id).unwrap();
                let matched_bytes = &bytes[..len];
                results.push(SearchResult {
                    matched: String::from_utf8(matched_bytes.to_vec()).unwrap(),
                    entry: entry.clone(),
                });
            }
        }
        results
    }

    /// Serializes the trie into a vector of bytes.
    pub fn serialize(&self, compress: bool) -> Result<Vec<u8>, failure::Error> {
        let encoded: Vec<u8> = serialize(&self)?;
        if compress {
            let mut wtr = snap::Writer::new(Vec::new());
            wtr.write_all(&encoded)?;
            Ok(wtr.into_inner()?)
        } else {
            Ok(encoded)
        }
    }

    /// Deserializes a vector of bytes into a trie.
    pub fn deserialize<R: Read>(data: R, compressed: bool) -> Result<Dictionary, failure::Error> {
        let dict: Dictionary = if compressed {
            let mut decoder = snap::Reader::new(data);
            deserialize_from(&mut decoder)?
        } else {
            deserialize_from(data)?
        };
        Ok(dict)
    }
}