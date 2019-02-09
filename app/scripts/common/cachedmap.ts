export class CachedMap<K, V> {
    private cache: Map<K, V | Promise<V>>;
    private loader: (key: K) => Promise<V>;
    constructor(loader: (key: K) => Promise<V>) {
        this.loader = loader;
        this.cache = new Map();
    }
    public get(key: K): Promise<V> {
        return new Promise((resolve, reject) => {
            const value = this.cache.get(key);
            if (value) {
                resolve(value);
            } else {
                const promise = this.loader(key);
                this.cache.set(key, promise);
                promise.then((resolvedValue: V) => {
                    this.cache.set(key, resolvedValue);
                    resolve(resolvedValue);
                }).catch(reject);
            }
        });
    }
}
