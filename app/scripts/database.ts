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
                    reject(`Key ${key} not found in ${tableName}.`);
                } else {
                    console.log(`Loaded ${key} for ${tableName} .`);
                    resolve(result.value);
                }
            }).catch(reject);
        });
    };

    let importer = (key: K, data: string) => {
        let value: V = JSON.parse(data);
        return table.put({ key, value }).then(() => {
            console.log(`Imported data into ${tableName} for ${key}.`);
        });
    };

    return { loader, importer };
}