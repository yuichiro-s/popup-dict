import toml from 'toml';

import { Package, Settings, createPackage } from '../common/package';
import { sendCommand } from '../content/command';

export function loadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log(`Loading ${file.name} ...`);
        let reader = new FileReader();
        reader.onload = () => {
            console.log(`Loaded ${file.name} .`);
            let data = reader.result as string;
            resolve(data);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function validateAndInit(settings: Settings): Package {
    function check(field: string) {
        if (!(field in settings)) {
            throw new Error(`${field} does not exist!`);
        }
    }
    check('id');
    check('name');
    check('languageCode');
    check('tokenizeByWhiteSpace');
    return createPackage(settings);
}

function gatherNecessaryFiles(files: File[]) {
    let settingsFile = null;
    let trieFile = null;
    let lemmatizerFile = null;
    let indexFile = null;
    let frequencyFile = null;
    let subDictFiles: File[] = [];
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let added = true;
        if (file.name === 'settings.toml') {
            settingsFile = file;
        } else if (file.name === 'trie.json') {
            trieFile = file;
        } else if (file.name === 'lemmatizer.json') {
            lemmatizerFile = file;
        } else if (file.name === 'index.json') {
            indexFile = file;
        } else if (file.name === 'frequency.json') {
            frequencyFile = file;
        } else if (file.name.startsWith('subdict')) {
            subDictFiles.push(file);
        } else {
            added = false;
        }
        if (added) {
            totalSize += file.size;
        }
    }
    return {
        settingsFile,
        trieFile,
        lemmatizerFile,
        indexFile,
        frequencyFile,
        subDictFiles,
        totalSize,
    };
}

export function validatePackage(files: File[]) {
    const errors = [];
    const warnings = [];

    const {
        settingsFile,
        trieFile,
        lemmatizerFile,
        indexFile,
        frequencyFile,
        subDictFiles,
    } = gatherNecessaryFiles(files);

    if (settingsFile === null) errors.push('settings.toml is not found.');
    if (trieFile === null) errors.push('trie.json is not found.');
    if (lemmatizerFile === null) errors.push('lemmatizer.json is not found.');
    if (frequencyFile === null) warnings.push('frequency.json is not found.');
    if (indexFile === null) warnings.push('index.json is not found.');
    if (subDictFiles.length === 0) warnings.push('No dictionary files are found.');

    return { errors, warnings };
}

type PromiseOr<T> = Promise<T> | T;
type PromiseOrString = PromiseOr<string>;

export async function importPackage(
    settings: PromiseOr<Settings>,
    trieJSON: PromiseOrString,
    lemmatizerJSON: PromiseOrString,
    indexJSON: PromiseOrString,
    subDictJSONs: Map<number, PromiseOrString>,
    frequencyJSON: PromiseOrString,
    progressFn: (progress: number, msg: string) => void,
) {
    const TOTAL = 7;

    /* STEP 1: import settings */
    progressFn(0 / TOTAL, 'Importing trie...');
    const pkg = validateAndInit(await settings);  // validate
    const pkgId = pkg.id;
    if (await sendCommand({ type: 'get-package', pkgId })) {
        throw new Error(`Package ${pkgId} already exists!`);
    }

    const makePromise = (type: any, jsonPromise: PromiseOrString, obj?: Object) => {
        return (async () => {
            const json = await jsonPromise;
            let args = { type, pkgId, data: json };
            if (obj) {
                args = Object.assign(args, obj);
            }
            await sendCommand(args);
        })();
    };

    /* STEP 2: import trie */
    /* STEP 3: import entries */
    progressFn(1 / TOTAL, 'Importing trie...');
    progressFn(2 / TOTAL, 'Importing entries...');
    const trie = makePromise('import-trie', trieJSON).then(() => {
        return sendCommand({ type: 'import-entries', pkgId });
    });

    /* STEP 4: import lemmatizer */
    progressFn(3 / TOTAL, 'Importing lemmatizer...');
    const lemmatizer = makePromise('import-lemmatizer', lemmatizerJSON);

    /* STEP 5: import dictionary index */
    progressFn(4 / TOTAL, 'Importing dictionary index...');
    const index = makePromise('import-index', indexJSON);

    /* STEP 6: import dictionary */
    const ps: Promise<any>[] = [];
    let i = 0;
    subDictJSONs.forEach((json: Promise<string>, n: number) => {
        const progress = (5 + i / subDictJSONs.size) / TOTAL;
        progressFn(progress, `Importing dictionary [${i + 1}/${subDictJSONs.size}]...`);
        const p = makePromise('import-dictionary', json, { n });
        ps.push(p);
    });

    /* STEP 7: import frequency */
    progressFn(6 / TOTAL, 'Importing frequency list...');
    const frequency = makePromise('import-frequency', frequencyJSON);

    await Promise.all([trie, lemmatizer, index, ...ps, frequency]);

    // import completed
    progressFn(1., 'Done.');
    await sendCommand({ type: 'update-package', pkg });
    console.log(`Imported ${pkg.name}.`);

    return pkg;
}

export async function importPackageFromFiles(files: File[], progressFn: (progress: number, msg: string) => void) {
    const {
        settingsFile,
        trieFile,
        lemmatizerFile,
        indexFile,
        frequencyFile,
        subDictFiles,
    } = gatherNecessaryFiles(files);

    const settings = loadFile(settingsFile!).then(toml.parse);
    const trieJSON = loadFile(trieFile!);
    const lemmatizerJSON = lemmatizerFile ? loadFile(lemmatizerFile) : '{}';
    const frequencyJSON = frequencyFile ? loadFile(frequencyFile) : '{}';

    const indexJSON = indexFile ? loadFile(indexFile) : '{}';
    const subDictJSONs = new Map<number, Promise<string>>();
    for (let i = 0; i < subDictFiles.length; i++) {
        const file = subDictFiles[i];
        let n = Number.parseInt(file.name.replace('subdict', '').replace('.json', ''));
        const json = loadFile(file);
        subDictJSONs.set(n, json);
    }

    return await importPackage(
        settings,
        trieJSON,
        lemmatizerJSON,
        indexJSON,
        subDictJSONs,
        frequencyJSON,
        progressFn,
    );
}