import { Settings } from './settings';

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

export async function removePackage(pkgId: PackageID) {
    // TODO: implement this
    throw new Error('Not implemented.');
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