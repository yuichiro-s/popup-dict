import { get, has } from "../common/objectmap";
import { IPackage, PackageID } from "../common/package";
import { deleteAllDictionaries, deleteIndex } from "./dictionary";
import { deleteEntries } from "./entry";
import { deleteFrequencyTable } from "./frequency";
import { deleteLemmatizer } from "./lemmatizer";
import { deleteTrie } from "./search";
import { deleteStats } from "./stats";

export function updatePackage(pkg: IPackage) {
    return new Promise((resolve) => {
        const pkgId = pkg.id;
        getPackages().then((packages) => {
            packages[pkgId] = pkg;
            chrome.storage.local.set({ packages }, resolve);
        });
    });
}

export async function getPackage(pkgId: PackageID) {
    const packages = await getPackages();
    return packages && get(packages, pkgId);
}

export function getPackages(): Promise<{ [pkgId: string]: IPackage }> {
    // TODO: cache packages
    return new Promise((resolve) => {
        chrome.storage.local.get("packages", (result) => {
            if (result && result.packages) {
                resolve(result.packages);
            } else {
                resolve({});
            }
        });
    });
}

export function deletePackage(pkgId: PackageID) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("packages", (result) => {
            if (result && result.packages && has(result.packages, pkgId)) {
                delete result.packages[pkgId];
                chrome.storage.local.set({ packages: result.packages }, () => {
                    Promise.all([
                        deleteAllDictionaries(pkgId),
                        deleteIndex(pkgId),
                        deleteLemmatizer(pkgId),
                        deleteFrequencyTable(pkgId),
                        deleteTrie(pkgId),
                        deleteStats(pkgId),
                        deleteEntries(pkgId),
                    ]).then(resolve).catch(reject);
                });
            } else {
                reject(new Error(`${pkgId} not found.`));
            }
        });
    });
}

export function getLastPackageID() {
    return new Promise((resolve) => {
        chrome.storage.local.get("lastPackageID", (result) => {
            if (result && result.lastPackageID) {
                resolve(result.lastPackageID);
            } else {
                resolve(undefined);
            }
        });
    });
}

export function setLastPackage(pkgId: PackageID) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ lastPackageID: pkgId }, resolve);
    });
}
