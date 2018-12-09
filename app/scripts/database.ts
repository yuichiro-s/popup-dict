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

function put<K, V>(table: Dexie.Table<DatabaseEntry<K, V>, K>, key: K, value: V) {
    return table.put({ key, value });
}

function get<K, V>(table: Dexie.Table<DatabaseEntry<K, V>, K>, key: K) {
    return new Promise((resolve, reject) => {
        table.get(key).then(result => {
            if (result === undefined) {
                reject(`Key ${key} not found in ${table.name}.`);
            } else {
                resolve(result.value);
            }
        });
    });
}

export function makeLoader<K, V>(tableName: string) {
    return (key: K) => {
        return new Promise((resolve, reject) => {
            let table = getTable<K, V>(tableName);
            console.log(`Loading ${key} for ${tableName} ...`);
            get(table, key).then(value => {
                console.log(`Loaded ${key} for ${tableName} .`);
                resolve(value);
            }).catch(reject);
        });
    };
}
