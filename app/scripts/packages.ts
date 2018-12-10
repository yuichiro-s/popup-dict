import { Settings } from './settings';

export type PackageID = string;

export async function addPackage(settings: Settings) {
    return new Promise(resolve => {
        let pkgId = settings.id;
        getPackages().then(packages => {
            packages[pkgId] = settings;
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
    throw new Error('Not implemented.');
}