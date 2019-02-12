import { Command, ContentCommand } from "../common/commands";
import { lookUpDictionary } from "./dictionary";
import { isEnabled } from "./enabled";
import { clearEntries, exportUserData, importUserData, listEntries, updateEntries, updateEntry } from "./entry";
import { getFrequency } from "./frequency";
import { getGlobalSettings, setGlobalSettings } from "./global-settings";
import { guessPackage } from "./guess-package";
import { deletePackage, getLastPackageID, getPackage, getPackages, setLastPackage, updatePackage } from "./packages";
import { searchAllBatch, searchWithPackage } from "./search";
import { getStats, getStatsHistory } from "./stats";

export function sendContentCommand(command: ContentCommand, tabId: number): Promise<any> {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, command, resolve);
    });
}

export const messageHandler = (request: Command, sender: any, sendResponse: any) => {
    const handler = async () => {
        let response;
        try {
            let result;

            if (request.type === "is-enabled") {
                result = await isEnabled();

            } else if (request.type === "get-global-settings") {
                result = await getGlobalSettings();
            } else if (request.type === "set-global-settings") {
                result = await setGlobalSettings(request.globalSettings);

            } else if (request.type === "lookup-dictionary") {
                result = await lookUpDictionary(request.keys, request.pkgId);
            } else if (request.type === "get-frequency") {
                result = await getFrequency(request.keys, request.pkgId);

            } else if (request.type === "get-tab") {
                result = await new Promise((resolve) => {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        resolve(tabs[0]);
                    });
                });
            } else if (request.type === "search") {
                result = await searchWithPackage(request.pkgId, request.key);
            } else if (request.type === "search-all-batch") {
                result = await searchAllBatch(request.pkgId, request.tokensBatch);

            } else if (request.type === "update-entry") {
                result = await updateEntry(request.entry);
            } else if (request.type === "update-entries") {
                result = await updateEntries(request.entries);
            } else if (request.type === "clear-entries") {
                result = await clearEntries();
            } else if (request.type === "list-entries") {
                result = await listEntries(request.pkgId, request.state);
            } else if (request.type === "import-user-data") {
                result = await importUserData(request.dataURL);
            } else if (request.type === "export-user-data") {
                result = await exportUserData();

            } else if (request.type === "get-stats") {
                result = await getStats(request.pkgId);
            } else if (request.type === "get-stats-history") {
                result = await getStatsHistory(request.pkgId);

            } else if (request.type === "get-packages") {
                result = await getPackages();
            } else if (request.type === "get-package") {
                result = await getPackage(request.pkgId);
            } else if (request.type === "set-last-package") {
                result = await setLastPackage(request.pkgId);
            } else if (request.type === "get-last-package-id") {
                result = await getLastPackageID();
            } else if (request.type === "update-package") {
                result = await updatePackage(request.pkg);
            } else if (request.type === "delete-package") {
                result = await deletePackage(request.pkgId);

            } else if (request.type === "guess-package") {
                result = await guessPackage(request.text);
            }

            response = { status: "ok", data: result };
        } catch (e) {
            response = { status: "error", data: e.message };
        }
        sendResponse(response);
    };
    handler();

    return true;
};
