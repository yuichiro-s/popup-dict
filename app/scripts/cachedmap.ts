export class CachedMap<K, V> {
    private cache: Map<K, V | Promise<V>>;
    private loader: Function;
    constructor(loader: Function) {
        this.loader = loader;
        this.cache = new Map();
    }
    get(key: K): Promise<V> {
        return new Promise((resolve) => {
            let value = this.cache.get(key);
            if (value) {
                resolve(value);
            } else {
                let promise = this.loader(key);
                this.cache.set(key, promise);
                promise.then((value: V) => {
                    this.cache.set(key, value);
                    resolve(value);
                });
            }
        });
    }
}
