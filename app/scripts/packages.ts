import { Settings } from './settings';
import { deleteDictionary, deleteIndex } from './dictionary';
import { deleteFrequencyTable } from './frequency';
import { deleteLemmatizer } from './lemmatizer';
import { deleteTrie } from './trie';

export type PackageID = string;

export function updatePackage(pkg: Settings) {
    return new Promise(resolve => {
        let pkgId = pkg.id;
        getPackages().then(packages => {
            packages[pkgId] = pkg;
            chrome.storage.local.set({ 'packages': packages }, resolve);
        });
    });
}

export async function getPackage(pkgId: PackageID) {
    let packages = await getPackages();
    return packages && packages[pkgId];
}

export function getPackages(): Promise<{ [pkgId: string]: Settings }> {
    // TODO: cache packages
    return new Promise(resolve => {
        chrome.storage.local.get('packages', result => {
            if (result && result.packages) {
                resolve(result.packages);
            } else {
                resolve({});
            }
        });
    });
}

export async function deletePackage(pkgId: PackageID) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('packages', result => {
            if (result && result.packages && pkgId in result.packages) {
                delete result.packages[pkgId];
                chrome.storage.local.set({ 'packages': result.packages }, () => {
                    Promise.all([
                        deleteDictionary(pkgId),
                        deleteIndex(pkgId),
                        deleteLemmatizer(pkgId),
                        deleteFrequencyTable(pkgId),
                        deleteTrie(pkgId),
                    ]).then(resolve).catch(reject);
                });
            } else {
                reject(`${pkgId} not found.`);
            }
        });
    });
}

export function getLastPackageID() {
    return new Promise(resolve => {
        chrome.storage.local.get('lastPackageID', result => {
            if (result && result.lastPackageID) {
                resolve(result.lastPackageID);
            } else {
                resolve(undefined);
            }
        });
    });
}

export function setLastPackage(pkgId: PackageID) {
    return new Promise(resolve => {
        chrome.storage.local.set({ 'lastPackageID': pkgId }, resolve);
    });
}