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

function guessPackage(): Promise<IPackage | null> {
    // get list of languages to consider
    const text = getText();
    return sendCommand({ type: "guess-package", text });
}

export async function setPackageID(pkgId: PackageID) {
    console.log("Language set to: " + pkgId);
    currentPackage = await sendCommand({ type: "get-package", pkgId });
    // TODO: make sure last package ID is updated from all code paths.
    await sendCommand({type: "set-last-package", pkgId: (await currentPackage)!.id});
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
