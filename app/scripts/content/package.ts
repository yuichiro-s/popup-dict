import { PackageID, Package } from '../common/package';
import { sendCommand } from './command';
import { all } from 'franc';

let currentPackage: Promise<Package | null> | null = null;

const PACKAGE_SPECIFIER_ID = 'highlighter-package-specifier';

function getText() {
    // gather text
    let texts: string[] = [];
    function dfs(element: Element) {
        if (element.tagName !== 'SCRIPT') {
            let nodes = element.childNodes;
            for (let j = 0; j < nodes.length; j++) {
                let node = nodes[j];
                if (node.nodeType === Node.TEXT_NODE) {
                    texts.push(node.textContent!);
                }
            }
        }
        for (let i = 0; i < element.children.length; i++) {
            dfs(element.children[i]);
        }
    }
    dfs(document.body);
    let text = texts.join('\n');
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
        let text = getText();
        let guess = all(text, { whitelist: supportedLanguageCodes });
        let pkg = codeToPackage.get(guess[0][0])!;
        if (pkg) {
            let pkgName = pkg.name;
            let confidence = guess[0][1];
            console.log(`Guessed package: ${pkgName} (confidence = ${confidence})`);
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