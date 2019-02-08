import { PackageID, Package } from '../common/package';
import { sendCommand } from './command';
import franc from 'franc';

let currentPackage: Promise<Package | null> | null = null;

const PACKAGE_SPECIFIER_ID = 'highlighter-package-specifier';

const NON_TEXT_TAGS = [
    'SCRIPT', 'STYLE', 'NOSCRIPT',
];

const MAX_LENGTH = 1000;

function getText() {
    // gather text
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    const pTexts: string[] = [];
    let node;
    let pLen = 0;
    while ((node = walker.nextNode())) {
        const t = node.textContent!.trim();
        const parent = node.parentElement;
        if (t.length > 1 && parent && !NON_TEXT_TAGS.includes(parent.nodeName)) {
            if (parent.nodeName === 'P') {
                pLen += t.length;
                pTexts.push(t);
                if (pLen >= MAX_LENGTH) break;
            } else {
                texts.push(t);
            }
        }
    }
    let text = pTexts.join('\n');
    if (text.length < MAX_LENGTH) {
        for (const t of texts) {
            text += '\n' + t;
        }
    }
    return text;
}

async function guessPackage(): Promise<Package | null> {
    let packages = await sendCommand({ type: 'get-packages' });
    let codeToPackage = new Map<string, Package>();
    for (let pkgId in packages) {
        let pkg: Package = packages[pkgId];
        codeToPackage.set(pkg.languageCode, pkg);
    }
    let supportedLanguageCodes = Array.from(codeToPackage.keys());
    if (supportedLanguageCodes.length === 0) {
        return null;
    } else {
        const text = getText();
        const lang = franc(text, { whitelist: supportedLanguageCodes });
        let pkg = codeToPackage.get(lang)!;
        if (pkg) {
            let pkgName = pkg.name;
            console.log(`Guessed language: ${lang}`);
            console.log(`Using: ${pkgName}`);
            return pkg;
        } else {
            let firstPackage = codeToPackage.values().next().value;
            return firstPackage;
        }
    }
}

export async function setPackageID(pkgId: PackageID) {
    console.log('Language set to: ' + pkgId);
    currentPackage = await sendCommand({ type: 'get-package', pkgId });
}

export async function getPackage(): Promise<Package | null> {
    // TODO: when can the result be none?
    if (currentPackage === null) {
        // currentPackage has not been initialized
        // determine current package
        currentPackage = new Promise(resolve => {
            let e = document.getElementById(PACKAGE_SPECIFIER_ID);
            if (e && e.dataset && e.dataset.pkg) {
                let pkgId = e.dataset.pkg;
                console.log(`Package specifier found: ${pkgId}`);
                sendCommand({ type: 'get-packages' }).then(packages => {
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