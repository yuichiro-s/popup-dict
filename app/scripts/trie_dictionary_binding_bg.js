import * as import_b from './trie_dictionary_binding';

export const booted =
  WebAssembly.instantiateStreaming(new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();
    req.open("GET", chrome.runtime.getURL('data/trie_dictionary_binding_bg.wasm'));
    req.responseType = "arraybuffer";
    req.onload = () => {
      resolve(new Response(req.response, {
        headers: new Headers({
          'Content-Type': 'application/wasm'
        })
      }));
    };
    req.onerror = reject;
    req.send();
  }), {
    './trie_dictionary_binding': import_b,
  })
  .then(obj => {
    const wasm = obj.instance;
    memory = wasm.exports.memory;
    __indirect_function_table = wasm.exports.__indirect_function_table;
    __heap_base = wasm.exports.__heap_base;
    __data_end = wasm.exports.__data_end;
    __rustc_debug_gdb_scripts_section__ = wasm.exports.__rustc_debug_gdb_scripts_section__;
    __wbg_dictionary_free = wasm.exports.__wbg_dictionary_free;
    dictionary_search = wasm.exports.dictionary_search;
    dictionary_deserialize = wasm.exports.dictionary_deserialize;
    __wbindgen_global_argument_ptr = wasm.exports.__wbindgen_global_argument_ptr;
    __wbindgen_malloc = wasm.exports.__wbindgen_malloc;
    __wbindgen_free = wasm.exports.__wbindgen_free;

  });
export let memory;
export let __indirect_function_table;
export let __heap_base;
export let __data_end;
export let __rustc_debug_gdb_scripts_section__;
export let __wbg_dictionary_free;
export let dictionary_search;
export let dictionary_deserialize;
export let __wbindgen_global_argument_ptr;
export let __wbindgen_malloc;
export let __wbindgen_free;
