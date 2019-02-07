import Dexie from 'dexie';

interface DatabaseEntry<K, V> {
    key: K;
    value: V;
}

class Database<K, V> extends Dexie {
    database: Dexie.Table<DatabaseEntry<K, V>, K>;
    constructor(name: string) {
        super(name);
        this.version(1).stores({
            database: 'key',
        });
    }
}

function getTable<K, V>(name: string) {
    let db = new Database<K, V>(name);
    return db.database;
}

export function table<K, V>(tableName: string) {
    let table = getTable<K, V>(tableName);

    let loader = (key: K) => {
        return new Promise((resolve, reject) => {
            console.log(`Loading ${key} for ${tableName} ...`);
            table.get(key).then(result => {
                if (result === undefined) {
                    let msg = `Key ${key} not found in ${tableName}.`;
                    console.log(msg);
                    reject(msg);
                } else {
                    console.log(`Loaded ${key} for ${tableName} .`);
                    resolve(result.value);
                }
            }).catch(reject);
        });
    };

    let importer = (key: K, value: V) => {
        return table.put({ key, value }).then(() => {
            console.log(`Imported data into ${tableName} for ${key}.`);
        });
    };

    let deleter = (key: K) => {
        return table.delete(key).then(() => {
            console.log(`Deleted ${key} from ${tableName}.`);
        });
    };

    return { table, loader, importer, deleter };
}