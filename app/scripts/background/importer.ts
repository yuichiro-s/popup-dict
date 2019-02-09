import { IDictionary, IIndex } from "../common/dictionary";
import { IFrequencyTable } from "../common/frequency";
import { ImportMessage, IProgress } from "../common/importer";
import { ILemmatizer } from "../common/lemmatizer";
import { createPackage, ISettings } from "../common/package";
import { ITrieNode } from "../common/trie";
import { loadEijiro } from "../preprocess/eijiro";
import { loadJSON } from "../preprocess/loader-browser";
import { importDictionary, importIndex } from "./dictionary";
import { importEntries } from "./entry";
import { importFrequencyTable } from "./frequency";
import { importLemmatizer } from "./lemmatizer";
import { updatePackage } from "./packages";
import { importTrie } from "./search";

type PromiseOr<T> = Promise<T> | T;

async function importPackage(
    settings: ISettings,
    trie: PromiseOr<ITrieNode>,
    lemmatizer: PromiseOr<ILemmatizer>,
    index: PromiseOr<IIndex>,
    subDicts: { [index: number]: PromiseOr<IDictionary> },
    frequency: PromiseOr<IFrequencyTable>,
    progressFn: (progress: IProgress) => void,
) {
    const pkg = createPackage(settings);
    const pkgId = pkg.id;

    const TOTAL = 7;
    let step = 0;

    const p = async (promise: Promise<any>, msg: string, delta?: number) => {
        const result = await promise;
        if (delta === undefined) { delta = 1; }
        step += delta;
        progressFn({ msg, ratio: step / TOTAL });
        return result;
    };

    await Promise.all([
        p(
            importTrie(pkgId, await trie),
            "Imported trie.")
            .then(() => p(
                importEntries(pkgId),
                "Imported entries.")),
        p(
            importLemmatizer(pkgId, await lemmatizer),
            "Imported lemmatizer."),
        p(
            importIndex(pkgId, await index),
            "Imported index.",
        ),
        Promise.all(Object.entries(subDicts).map(async ([n, subDict]) => {
            const key = [pkgId, n].join(",");
            const total = Object.entries(subDicts).length;
            return p(
                importDictionary(key, await subDict),
                `Imported dictionary (${parseInt(n, 10) + 1} of ${total})`,
                1 / total);
        })),
        p(
            importFrequencyTable(pkgId, await frequency),
            "Imported frequency."),
    ]);

    // import completed
    await p(updatePackage(pkg),
        "Done.");

    return pkg;
}

export const importerHandler = (port: chrome.runtime.Port) => {
    let connected = true;
    port.onDisconnect.addListener(() => { connected = false; });
    port.onMessage.addListener(async (msg: ImportMessage) => {
        const progressFn = (progress: IProgress) => {
            if (connected) {
                port.postMessage({ type: "progress", progress });
            }
        };
        let pkg;

        if (msg.type === "import-eijiro") {
            const {
                lemmatizer,
                trie,
                index,
                dictionaryChunks,
                freqs,
                settings,
            } = await loadEijiro(msg.eijiro, msg.inflection, msg.frequency, msg.whitelist, 1000,
                (progress: IProgress) => {
                    progressFn({ msg: progress.msg, ratio: progress.ratio / 2 });
                });

            const subDicts: { [n: number]: IDictionary } = {};
            dictionaryChunks.forEach((d, n) => { subDicts[n] = d; });

            pkg = await importPackage(
                settings,
                trie,
                lemmatizer,
                index,
                subDicts,
                freqs,
                (progress: IProgress) => {
                    progressFn({ msg: progress.msg, ratio: 0.5 + progress.ratio / 2 });
                });

        } else if (msg.type === "import-files") {
            const pTrie = loadJSON(msg.trie);
            const pLemmatizer = loadJSON(msg.lemmatizer);
            const pIndex = loadJSON(msg.index);
            const pFrequency = loadJSON(msg.frequency);
            const pSubDicts: { [n: string]: Promise<IDictionary> } = {};
            for (const [n, url] of Object.entries(msg.subDicts)) {
                pSubDicts[n] = loadJSON(url);
            }
            pkg = await importPackage(
                msg.settings,
                pTrie,
                pLemmatizer,
                pIndex,
                pSubDicts,
                pFrequency,
                progressFn);
        }

        if (connected) {
            port.postMessage({ type: "done", pkg });
        }
    });
};
