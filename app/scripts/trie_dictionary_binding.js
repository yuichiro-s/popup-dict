/* tslint:disable */
import * as wasm from './trie_dictionary_binding_bg';

let cachegetUint8Memory = null;

function getUint8Memory() {
  if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
    cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
  }
  return cachegetUint8Memory;
}

function passArray8ToWasm(arg) {
  const ptr = wasm.__wbindgen_malloc(arg.length * 1);
  getUint8Memory().set(arg, ptr / 1);
  return [ptr, arg.length];
}

let cachedTextDecoder = new TextDecoder('utf-8');

function getStringFromWasm(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
}

let cachedGlobalArgumentPtr = null;

function globalArgumentPtr() {
  if (cachedGlobalArgumentPtr === null) {
    cachedGlobalArgumentPtr = wasm.__wbindgen_global_argument_ptr();
  }
  return cachedGlobalArgumentPtr;
}

let cachegetUint32Memory = null;

function getUint32Memory() {
  if (cachegetUint32Memory === null || cachegetUint32Memory.buffer !== wasm.memory.buffer) {
    cachegetUint32Memory = new Uint32Array(wasm.memory.buffer);
  }
  return cachegetUint32Memory;
}

function _assertBoolean(n) {
  if (typeof (n) !== 'boolean') {
    throw new Error('expected a boolean argument');
  }
}

function freeDictionary(ptr) {

  wasm.__wbg_dictionary_free(ptr);
}
/**
 */
export class Dictionary {

  constructor() {
    throw new Error('cannot invoke `new` directly');
  }

  static __wrap(ptr) {
    const obj = Object.create(Dictionary.prototype);
    obj.ptr = ptr;

    return obj;
  }

  free() {
    const ptr = this.ptr;
    this.ptr = 0;
    freeDictionary(ptr);
  }
  /**
   * @param {Uint8Array} arg0
   * @returns {string}
   */
  search(arg0) {
    if (this.ptr === 0) {
      throw new Error('Attempt to use a moved value');
    }
    const [ptr0, len0] = passArray8ToWasm(arg0);
    const retptr = globalArgumentPtr();
    try {
      wasm.dictionary_search(retptr, this.ptr, ptr0, len0);
      const mem = getUint32Memory();
      const rustptr = mem[retptr / 4];
      const rustlen = mem[retptr / 4 + 1];

      const realRet = getStringFromWasm(rustptr, rustlen).slice();
      wasm.__wbindgen_free(rustptr, rustlen * 1);
      return realRet;


    } finally {
      wasm.__wbindgen_free(ptr0, len0 * 1);

    }

  }
  /**
   * @param {Uint8Array} arg0
   * @param {boolean} arg1
   * @returns {Dictionary}
   */
  static deserialize(arg0, arg1) {
    const [ptr0, len0] = passArray8ToWasm(arg0);
    _assertBoolean(arg1);
    try {
      return Dictionary.__wrap(wasm.dictionary_deserialize(ptr0, len0, arg1 ? 1 : 0));

    } finally {
      wasm.__wbindgen_free(ptr0, len0 * 1);

    }

  }
}

export function __wbindgen_throw(ptr, len) {
  throw new Error(getStringFromWasm(ptr, len));
}

export async function ready() {
  await wasm.booted;
}