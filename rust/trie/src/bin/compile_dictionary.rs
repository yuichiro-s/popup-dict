extern crate clap;
extern crate dictionary;
extern crate double_array_trie;
extern crate failure;
extern crate serde;
extern crate serde_json;

use clap::{App, Arg};
use dictionary::dict;
use failure::{err_msg, Error};
use std::collections::HashMap;
use std::fs;
use std::io::{self, BufRead, Write};

use double_array_trie::static_trie;
use serde_json::Value;

fn main() -> Result<(), Error> {
    let matches = App::new("compile_dictionary")
        .about("Compiles a JSON dictionary file into a binary")
        .arg(
            Arg::with_name("OUT")
                .help("Sets the output path of the created binary")
                .required(true),
        ).get_matches();
    let out = matches.value_of("OUT").unwrap();

    let stdin = io::stdin();
    let mut entries: Vec<String> = Vec::new();
    let mut form_to_entry_ids: HashMap<String, Vec<usize>> = HashMap::new();
    for line in stdin.lock().lines() {
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

    let dict = dict::Dictionary::new(static_trie::Trie::new(trie_entries.as_slice()), entries);
    let encoded: Vec<u8> = dict.serialize(true)?;
    let mut buffer = fs::File::create(out)?;
    buffer.write(&encoded)?;

    Ok(())
}
