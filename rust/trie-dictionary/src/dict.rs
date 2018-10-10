extern crate bincode;
extern crate double_array_trie;
extern crate failure;
extern crate serde;
extern crate serde_json;
extern crate snap;

use self::bincode::{deserialize_from, serialize};
use self::double_array_trie::static_trie::Trie;
use self::failure::err_msg;
use self::serde_json::Value;
use std::collections::HashMap;
use std::io::{BufRead, Read, Write};

#[derive(Serialize, Deserialize, Debug)]
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

    /// Loads a dictionary in JSON.
    pub fn load_from_json<R: BufRead>(data: R) -> Result<Dictionary, failure::Error> {
        let mut entries: Vec<String> = Vec::new();
        let mut form_to_entry_ids: HashMap<String, Vec<usize>> = HashMap::new();
        for line in data.lines() {
            // Each line follows the following format.
            //   [entry_object, [key1, key2, ...]]
            let l = line?;
            let entry_id = entries.len();
            let entry_json: Value = serde_json::from_str(&l)?;
            let entry_json_array = entry_json
                .as_array()
                .ok_or(err_msg(format!("Can't interpret as array: {}", l)))?;
            let keys = entry_json_array
                .get(1)
                .ok_or(err_msg(format!(
                    "Doesn't contain the second element: {}",
                    l
                )))?.as_array()
                .ok_or(err_msg(format!(
                    "Can't interpret the second element as array: {}",
                    l
                )))?;

            for key in keys {
                let key_str = key
                    .as_str()
                    .ok_or(err_msg(format!("Can't interpret as string: {}", key)))?;
                if form_to_entry_ids.contains_key(key_str) {
                    let vec = form_to_entry_ids.get_mut(key_str).unwrap();
                    vec.push(entry_id);
                } else {
                    let vec = vec![entry_id];
                    form_to_entry_ids.insert(key_str.to_string(), vec);
                }
            }

            let entry = entry_json_array
                .get(0)
                .ok_or(err_msg(format!("Doesn't contain the first element: {}", l)))?;
            entries.push(serde_json::ser::to_string(&entry).unwrap());
        }

        let mut trie_entries: Vec<(Vec<u8>, Vec<usize>)> = Vec::new();
        for (variant_form, entry_ids) in form_to_entry_ids {
            let key_bytes = variant_form.as_bytes().to_vec();
            trie_entries.push((key_bytes, entry_ids));
        }

        let dict = Dictionary::new(Trie::new(trie_entries.as_slice()), entries);
        Ok(dict)
    }
}
