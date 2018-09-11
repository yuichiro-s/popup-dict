extern crate cfg_if;
extern crate wasm_bindgen;

mod utils;

mod trie;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, trie!");
}