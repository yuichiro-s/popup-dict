import Dexie from "dexie";

interface IDatabaseEntry<K, V> {
    key: K;
    value: V;
}

class Database<K, V> extends Dexie {
    public database: Dexie.Table<IDatabaseEntry<K, V>, K>;
    constructor(name: string) {
        super(name);
        this.version(1).stores({
            database: "key",
        });
    }
}

function getDatabase<K, V>(name: string) {
    const db = new Database<K, V>(name);
    return db.database;
}

export function getTable<K, V>(tableName: string) {
    const table = getDatabase<K, V>(tableName);

    const loader: ((key: K) => Promise<V>) = (key: K) => {
        return new Promise((resolve, reject) => {
            console.log(`Loading ${key} for ${tableName} ...`);
            table.get(key).then((result) => {
                if (result === undefined) {
                    const msg = `Key ${key} not found in ${tableName}.`;
                    console.log(msg);
                    reject(msg);
                } else {
                    console.log(`Loaded ${key} for ${tableName} .`);
                    resolve(result.value);
                }
            }).catch(reject);
        });
    };

    const importer = (key: K, value: V) => {
        return table.put({ key, value }).then(() => {
            console.log(`Imported data into ${tableName} for ${key}.`);
        });
    };

    const deleter = (key: K) => {
        return table.delete(key).then(() => {
            console.log(`Deleted ${key} from ${tableName}.`);
        });
    };

    return { table, loader, importer, deleter };
}
