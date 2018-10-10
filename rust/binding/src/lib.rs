extern crate cfg_if;
extern crate dictionary;
extern crate serde_json;
extern crate wasm_bindgen;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

use std::io::BufReader;

cfg_if! {
    if #[cfg(feature = "console_error_panic_hook")] {
        extern crate console_error_panic_hook;
        pub use console_error_panic_hook::set_once as set_panic_hook;
    } else {
        #[inline]
        pub fn set_panic_hook() {}
    }
}

#[wasm_bindgen]
pub struct Dictionary {
    dict: dictionary::dict::Dictionary,
}

#[wasm_bindgen]
impl Dictionary {
    pub fn search(&self, query: &[u8]) -> String {
        let result = self.dict.search(std::str::from_utf8(query).unwrap());
        serde_json::to_string(&result).unwrap()
    }

    pub fn serialize(&self, compress: bool) -> Vec<u8> {
        self.dict.serialize(compress).unwrap()
    }

    pub fn deserialize(data: &[u8], compressed: bool) -> Dictionary {
        Dictionary {
            dict: dictionary::dict::Dictionary::deserialize(data, compressed).unwrap(),
        }
    }

    pub fn load_from_json(data: String) -> Dictionary {
        let mut buffer = BufReader::new(data.as_bytes());
        Dictionary {
            dict: dictionary::dict::Dictionary::load_from_json(buffer).unwrap()
        }
    }
}
