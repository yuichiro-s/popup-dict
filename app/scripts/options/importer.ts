import * as toml from "toml";

import { ImportMessage, IProgress } from "../common/importer";
import { ISettings } from "../common/package";
import { sendCommand } from "../content/command";
import { PKG_ID } from "../preprocess/eijiro";

export function loadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log(`Loading ${file.name} ...`);
        const reader = new FileReader();
        reader.onload = () => {
            console.log(`Loaded ${file.name} .`);
            const data = reader.result as string;
            resolve(data);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function validate(settings: ISettings) {
    function check(field: string) {
        if (!(field in settings)) {
            throw new Error(`${field} does not exist!`);
        }
    }
    check("id");
    check("name");
    check("languageCode");
    check("tokenizeByWhiteSpace");
}

function gatherNecessaryFiles(files: File[]) {
    let settingsFile = null;
    let trieFile = null;
    let lemmatizerFile = null;
    let indexFile = null;
    let frequencyFile = null;
    const subDictFiles: File[] = [];
    let totalSize = 0;
    for (const file of files) {
        let added = true;
        if (file.name === "settings.toml") {
            settingsFile = file;
        } else if (file.name === "trie.json") {
            trieFile = file;
        } else if (file.name === "lemmatizer.json") {
            lemmatizerFile = file;
        } else if (file.name === "index.json") {
            indexFile = file;
        } else if (file.name === "frequency.json") {
            frequencyFile = file;
        } else if (file.name.startsWith("subdict")) {
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

    if (settingsFile === null) { errors.push("settings.toml is not found."); }
    if (trieFile === null) { errors.push("trie.json is not found."); }
    if (lemmatizerFile === null) { errors.push("lemmatizer.json is not found."); }
    if (frequencyFile === null) { warnings.push("frequency.json is not found."); }
    if (indexFile === null) { warnings.push("index.json is not found."); }
    if (subDictFiles.length === 0) { warnings.push("No dictionary files are found."); }

    return { errors, warnings };
}

export function importPackage(
    msg: ImportMessage,
    progressFn: (progress: IProgress) => void,
) {
    return new Promise((resolve, reject) => {
        let pkgId: string;
        if (msg.type === "import-eijiro") {
            pkgId = PKG_ID;
        } else {
            try {
                validate(msg.settings);
            } catch (e) {
                reject(e);
            }
            pkgId = msg.settings.id;
        }
        sendCommand({ type: "get-package", pkgId }).then((pkg) => {
            if (pkg) {
                reject(new Error(`Package ${pkgId} already exists!`));
            } else {
                const port = chrome.runtime.connect();
                port.onMessage.addListener((response) => {
                    if (response.type === "progress") {
                        progressFn(response.progress);
                    } else if (response.type === "done") {
                        port.disconnect();
                        resolve(response.pkg);
                    }
                });
                port.postMessage(msg);
            }
        });
    });
}

export async function importPackageFromFiles(files: File[], progressFn: (progres: IProgress) => void) {
    const {
        settingsFile,
        trieFile,
        lemmatizerFile,
        indexFile,
        frequencyFile,
        subDictFiles,
    } = gatherNecessaryFiles(files);

    const settings: ISettings = await loadFile(settingsFile!).then(toml.parse);
    const trie = URL.createObjectURL(trieFile!);
    const lemmatizer = URL.createObjectURL(lemmatizerFile!);
    const frequency = URL.createObjectURL(frequencyFile!);
    const index = URL.createObjectURL(indexFile);
    const subDicts: { [n: number]: string } = {};
    for (const file of subDictFiles) {
        const nStr = file.name.replace("subdict", "").replace(".json", "");
        const n = Number.parseInt(nStr, 10);
        subDicts[n] = URL.createObjectURL(file);
    }

    return importPackage(
        {
            type: "import-files",
            settings,
            trie,
            lemmatizer,
            index,
            subDicts,
            frequency,
        },
        progressFn);
}
