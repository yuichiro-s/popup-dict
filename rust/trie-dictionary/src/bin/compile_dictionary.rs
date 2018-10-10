extern crate clap;
extern crate dictionary;
extern crate double_array_trie;
extern crate failure;
extern crate serde;
extern crate serde_json;

use clap::{App, Arg};
use dictionary::dict;
use failure::Error;
use std::fs;
use std::io::{self, Write};

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
    let dict = dict::Dictionary::load_from_json(stdin.lock())?;
    let encoded: Vec<u8> = dict.serialize(true)?;
    let mut buffer = fs::File::create(out)?;
    buffer.write(&encoded)?;

    Ok(())
}
