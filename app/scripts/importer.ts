import cloneDeep from 'lodash/cloneDeep';

import { sendCommand } from './command';

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

function gatherNecessaryFiles(files: File[]) {
    let settingsFile = null;
    let trieFile = null;
    let lemmatizerFile = null;
    let entriesFile = null;
    let indexFile = null;
    let frequencyFile = null;
    let subDictFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (file.name === 'settings.json') {
            settingsFile = file;
        } else if (file.name === 'trie.json') {
            trieFile = file;
        } else if (file.name === 'lemmatizer.json') {
            lemmatizerFile = file;
        } else if (file.name === 'entries.json') {
            entriesFile = file;
        } else if (file.name === 'index.json') {
            indexFile = file;
        } else if (file.name === 'frequency.json') {
            frequencyFile = file;
        } else if (file.name.startsWith('subdict')) {
            subDictFiles.push(file);
        }
    }
    return {
        settingsFile,
        trieFile,
        lemmatizerFile,
        entriesFile,
        indexFile,
        frequencyFile,
        subDictFiles
    };
}

export function validatePackage(files: File[]) {
    const errors = [];
    const warnings = [];

    const {
        settingsFile,
        trieFile,
        lemmatizerFile,
        entriesFile,
        indexFile,
        frequencyFile,
        subDictFiles
    } = gatherNecessaryFiles(files);

    if (settingsFile === null) errors.push('settings.json is not found.');
    if (trieFile === null) errors.push('trie.json is not found.');
    if (lemmatizerFile === null) errors.push('lemmatizer.json is not found.');
    if (entriesFile === null) errors.push('entries.json is not found.');
    if (frequencyFile === null) warnings.push('frequency.json is not found.');
    if (indexFile === null) warnings.push('index.json is not found.');
    if (subDictFiles.length === 0) warnings.push('No dictionary files are found.');

    return { errors, warnings };
}

export async function importPackage(files: File[]) {
    const {
        settingsFile,
        trieFile,
        lemmatizerFile,
        entriesFile,
        indexFile,
        frequencyFile,
        subDictFiles
    } = gatherNecessaryFiles(files);

    // load settings
    let settings = JSON.parse(await loadFile(settingsFile!));

    // save default settings
    settings.default = cloneDeep(settings);

    // load each file
    let pkgId = settings.id;
    if (await sendCommand({ type: 'get-package', pkgId })) {
        throw new Error(`Package ${pkgId} already exists!`);
    }
    await sendCommand({ type: 'import-trie', pkgId, data: await loadFile(trieFile!) });
    await sendCommand({ type: 'import-entries', pkgId, data: await loadFile(entriesFile!) });
    let lemmatizerData = lemmatizerFile ? await loadFile(lemmatizerFile) : '{}';
    await sendCommand({ type: 'import-lemmatizer', pkgId, data: lemmatizerData });
    let indexData = indexFile ? await loadFile(indexFile) : '{}';
    await sendCommand({ type: 'import-index', pkgId, data: indexData });
    if (frequencyFile) {
        // if frequency.json does not exist, do not import any frequency info
        let frequencyData = await loadFile(frequencyFile);
        await sendCommand({ type: 'import-frequency', pkgId, data: frequencyData });
    }
    for (let file of subDictFiles) {
        let n = Number.parseInt(file.name.replace('subdict', '').replace('.json', ''));
        await sendCommand({ type: 'import-dictionary', pkgId, n, data: await loadFile(file) });
    }

    // import completed
    await sendCommand({ type: 'update-package', pkg: settings });
    console.log(`Imported ${settings.name}.`);

    return settings;
}