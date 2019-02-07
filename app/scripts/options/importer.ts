import toml from 'toml';

import { Settings } from '../common/package';
import { sendCommand } from '../content/command';
import { ImportMessage, Progress } from '../common/importer';

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

function validate(settings: Settings) {
    function check(field: string) {
        if (!(field in settings)) {
            throw new Error(`${field} does not exist!`);
        }
    }
    check('id');
    check('name');
    check('languageCode');
    check('tokenizeByWhiteSpace');
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

export function importPackage(
    msg: ImportMessage,
    progressFn: (progress: Progress) => void,
) {
    return new Promise((resolve, reject) => {
        try {
            validate(msg.settings);
        } catch (e) {
            reject(e);
        }
        const pkgId = msg.settings.id;
        sendCommand({ type: 'get-package', pkgId }).then(pkg => {
            if (pkg) {
                reject(new Error(`Package ${pkgId} already exists!`));
            } else {
                const port = chrome.runtime.connect();
                port.onMessage.addListener((msg) => {
                    if (msg.type === 'progress') {
                        progressFn(msg.progress);
                    } else if (msg.type === 'done') {
                        resolve(msg.pkg);
                    }
                });
                port.postMessage(msg);
            }
        });
    });
}

export async function importPackageFromFiles(files: File[], progressFn: (progres: Progress) => void) {
    const {
        settingsFile,
        trieFile,
        lemmatizerFile,
        indexFile,
        frequencyFile,
        subDictFiles,
    } = gatherNecessaryFiles(files);

    const settings: Settings = await loadFile(settingsFile!).then(toml.parse);
    const trie = URL.createObjectURL(trieFile!);
    const lemmatizer = URL.createObjectURL(lemmatizerFile!);
    const frequency = URL.createObjectURL(frequencyFile!);
    const index = URL.createObjectURL(indexFile);
    const subDicts: { [n: number]: string } = {};
    for (let i = 0; i < subDictFiles.length; i++) {
        const file = subDictFiles[i];
        let n = Number.parseInt(file.name.replace('subdict', '').replace('.json', ''));
        subDicts[n] = URL.createObjectURL(file);
    }

    return importPackage(
        {
            type: 'import-files',
            settings,
            trie,
            lemmatizer,
            index,
            subDicts,
            frequency
        },
        progressFn);
}