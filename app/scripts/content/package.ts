import * as franc from "franc";
import { IGlobalSettings } from "../common/global-settings";
import { keys } from "../common/objectmap";
import { IPackage, PackageID } from "../common/package";
import { sendCommand } from "./command";

let currentPackage: Promise<IPackage | null> | null = null;

const PACKAGE_SPECIFIER_ID = "highlighter-package-specifier";

const NON_TEXT_TAGS = [
    "SCRIPT", "STYLE", "NOSCRIPT",
];

const MAX_LENGTH = 1000;

function getText() {
    // gather text
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    const pTexts: string[] = [];
    let node;
    let pLen = 0;
    while (true) {
        node = walker.nextNode();
        if (node === null) { break; }
        const t = node.textContent!.trim();
        const parent = node.parentElement;
        if (t.length > 1 && parent && !NON_TEXT_TAGS.includes(parent.nodeName)) {
            if (parent.nodeName === "P") {
                pLen += t.length;
                pTexts.push(t);
                if (pLen >= MAX_LENGTH) { break; }
            } else {
                texts.push(t);
            }
        }
    }
    let text = pTexts.join("\n");
    if (text.length < MAX_LENGTH) {
        for (const t of texts) {
            text += "\n" + t;
        }
    }
    return text;
}

async function guessPackage(): Promise<IPackage | null> {
    // get list of languages to consider
    const packages = await sendCommand({ type: "get-packages" });
    const codeToPackage = new Map<string, IPackage>();
    for (const pkgId of keys(packages)) {
        const pkg: IPackage = packages[pkgId];
        codeToPackage.set(pkg.languageCode, pkg);
    }
    let supportedLanguageCodes = Array.from(codeToPackage.keys());
    const globalSettings: IGlobalSettings = await sendCommand({ type: "get-global-settings" });
    const blacklistedLanguages = globalSettings.blacklistedLanguages;
    supportedLanguageCodes = supportedLanguageCodes.concat(blacklistedLanguages);

    if (supportedLanguageCodes.length === 0) {
        return null;
    } else {
        const text = getText();
        const lang = franc(text, { whitelist: supportedLanguageCodes });
        if (lang === "und") {
            console.log(`Unable to determine language.`);
            return null;
        } else if (blacklistedLanguages.includes(lang)) {
            console.log(`Blacklisted language: ${lang}`);
            return null;
        } else {
            const pkg = codeToPackage.get(lang)!;
            const pkgName = pkg.name;
            console.log(`Guessed language: ${lang}`);
            console.log(`Using: ${pkgName}`);
            return pkg;
        }
    }
}

export async function setPackageID(pkgId: PackageID) {
    console.log("Language set to: " + pkgId);
    currentPackage = await sendCommand({ type: "get-package", pkgId });
}

export async function getPackage(): Promise<IPackage | null> {
    if (currentPackage === null) {
        // currentPackage has not been initialized
        // determine current package
        currentPackage = new Promise((resolve) => {
            const e = document.getElementById(PACKAGE_SPECIFIER_ID);
            if (e && e.dataset && e.dataset.pkg) {
                const pkgId = e.dataset.pkg;
                console.log(`Package specifier found: ${pkgId}`);
                sendCommand({ type: "get-packages" }).then((packages) => {
                    if (pkgId in packages) {
                        resolve(packages[pkgId]);
                    } else {
                        console.log(`Package ${pkgId} is not installed.`);
                        resolve(guessPackage());
                    }
                });
            } else {
                resolve(guessPackage());
            }
        });
    }
    return currentPackage;
}
