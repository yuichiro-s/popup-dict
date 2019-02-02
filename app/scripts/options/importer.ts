import toml from 'toml';
import cloneDeep from 'lodash/cloneDeep';

import { Package } from '../common/package';
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

function validateAndInit(pkg: Package) {
    function check(field: string) {
        if (!(field in pkg)) {
            throw new Error(`${field} does not exist!`);
        }
    }
    check('id');
    check('name');
    check('languageCode');
    check('tokenizeByWhiteSpace');
    if (!pkg.dictionaries) pkg.dictionaries = [];
    if (!pkg.showDictionary) pkg.showDictionary = 'unknown-or-marked';
    if (!pkg.template) pkg.template = '';
    if (!pkg.blacklist) pkg.blacklist = [];
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

export async function importPackage(files: File[], progressFn: (progress: number, msg: string) => void) {
    const {
        settingsFile,
        trieFile,
        lemmatizerFile,
        indexFile,
        frequencyFile,
        subDictFiles,
        totalSize,
    } = gatherNecessaryFiles(files);
    let size = 0;

    /* STEP 1: load settings */
    progressFn(size / totalSize, 'Loading settings...');
    let settings: Package = toml.parse(await loadFile(settingsFile!));
    validateAndInit(settings);  // validate
    settings.default = cloneDeep(settings);  // save default settings
    let pkgId = settings.id;
    if (await sendCommand({ type: 'get-package', pkgId })) {
        throw new Error(`Package ${pkgId} already exists!`);
    }
    size += settingsFile!.size;

    /* STEP 2: import trie */
    progressFn(size / totalSize, 'Importing trie...');
    await sendCommand({ type: 'import-trie', pkgId, data: await loadFile(trieFile!) });
    size += trieFile!.size;

    /* STEP 3: import entries */
    progressFn(size / totalSize, 'Importing entries...');
    await sendCommand({ type: 'import-entries', pkgId });

    /* STEP 4: import lemmatizer */
    progressFn(size / totalSize, 'Importing lemmatizer...');
    let lemmatizerData = lemmatizerFile ? await loadFile(lemmatizerFile) : '{}';
    await sendCommand({ type: 'import-lemmatizer', pkgId, data: lemmatizerData });
    size += lemmatizerFile!.size;

    /* STEP 5: import dictionary index */
    progressFn(size / totalSize, 'Importing dictionary index...');
    let indexData = indexFile ? await loadFile(indexFile) : '{}';
    await sendCommand({ type: 'import-index', pkgId, data: indexData });
    size += indexFile!.size;

    /* STEP 6: import dictionary */
    for (let i = 0; i < subDictFiles.length; i++) {
        const file = subDictFiles[i];
        progressFn(size / totalSize, `Importing dictionary [${i + 1}/${subDictFiles.length}]...`);
        let n = Number.parseInt(file.name.replace('subdict', '').replace('.json', ''));
        await sendCommand({ type: 'import-dictionary', pkgId, n, data: await loadFile(file) });
        size += file.size;
    }

    /* STEP 7: import frequency */
    progressFn(size / totalSize, 'Importing frequency list...');
    if (frequencyFile) {
        // if frequency.json does not exist, do not import any frequency info
        let frequencyData = await loadFile(frequencyFile);
        await sendCommand({ type: 'import-frequency', pkgId, data: frequencyData });
        size += frequencyFile.size;
    }

    // import completed
    progressFn(1., 'Done.');
    await sendCommand({ type: 'update-package', pkg: settings });
    console.log(`Imported ${settings.name}.`);

    return settings;
}