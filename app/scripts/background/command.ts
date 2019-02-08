import { getGlobalSettings, setGlobalSettings } from './global-settings';
import { ContentCommand, Command } from '../common/commands';
import { lookUpDictionary } from './dictionary';
import { getFrequency } from './frequency';
import { searchWithPackage, searchAllBatch } from './search';
import { updateEntry, listEntries, clearEntries, importUserData, exportUserData, updateEntries } from './entry';
import { getStats, getStatsHistory } from './stats';
import { getPackages, updatePackage, deletePackage, getPackage, getLastPackageID, setLastPackage } from './packages';
import { isEnabled } from './enabled';

export function sendContentCommand(command: ContentCommand, tabId: number): Promise<any> {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, command, resolve);
    });
}

export const messageHandler = (request: Command, sender: any, sendResponse: any) => {
    if (request.type === 'is-enabled') {
        isEnabled().then(sendResponse);

    } else if (request.type === 'get-global-settings') {
        getGlobalSettings().then(sendResponse);
    } else if (request.type === 'set-global-settings') {
        setGlobalSettings(request.globalSettings).then(sendResponse);

    } else if (request.type === 'lookup-dictionary') {
        lookUpDictionary(request.keys, request.pkgId).then(sendResponse);
    } else if (request.type === 'get-frequency') {
        getFrequency(request.keys, request.pkgId).then(sendResponse);

    } else if (request.type === 'get-tab') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse(tabs[0]);
        });
    } else if (request.type === 'search') {
        searchWithPackage(request.pkgId, request.key).then(sendResponse);
    } else if (request.type === 'search-all-batch') {
        searchAllBatch(request.pkgId, request.tokensBatch).then(sendResponse);

    } else if (request.type === 'update-entry') {
        updateEntry(request.entry).then(sendResponse);
    } else if (request.type === 'update-entries') {
        updateEntries(request.entries).then(sendResponse);
    } else if (request.type === 'clear-entries') {
        clearEntries().then(sendResponse);
    } else if (request.type === 'list-entries') {
        listEntries(request.pkgId, request.state).then(sendResponse);
    } else if (request.type === 'import-user-data') {
        importUserData(request.data).then(sendResponse);
    } else if (request.type === 'export-user-data') {
        exportUserData().then(sendResponse);

    } else if (request.type === 'get-stats') {
        getStats(request.pkgId).then(sendResponse);
    } else if (request.type === 'get-stats-history') {
        getStatsHistory(request.pkgId).then(sendResponse);

    } else if (request.type === 'get-packages') {
        getPackages().then(sendResponse);
    } else if (request.type === 'get-package') {
        getPackage(request.pkgId).then(sendResponse);
    } else if (request.type === 'set-last-package') {
        setLastPackage(request.pkgId).then(sendResponse);
    } else if (request.type === 'get-last-package-id') {
        getLastPackageID().then(sendResponse);
    } else if (request.type === 'update-package') {
        updatePackage(request.pkg).then(sendResponse);
    } else if (request.type === 'delete-package') {
        deletePackage(request.pkgId).then(sendResponse);
    }

    return true;
};
