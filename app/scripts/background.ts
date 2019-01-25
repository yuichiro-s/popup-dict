import { createContextMenu } from './contextmenu';
import { Command } from './command';
import { enable, isEnabled, addBrowserAction } from './enabled';
import { lemmatize, importLemmatizer } from './lemmatizer';
import { lookUpDictionary, importIndex, importDictionary } from './dictionary';
import { getFrequency } from './frequency';
import { search, searchAllBatch, importTrie } from './trie';
import { updateEntry, listEntries, clearEntries, importEntries, importUserData, exportUserData, getEntryStats } from './entry';
import { getPackages, updatePackage, getPackage, getLastPackageID, setLastPackage } from './packages';

/**
 * Handlers of commands from content scripts.
 */
chrome.runtime.onMessage.addListener(
    (request: Command, sender, sendResponse) => {
        if (request.type === 'is-enabled') {
            isEnabled().then(sendResponse);

        } else if (request.type === 'lemmatize') {
            lemmatize(request.tokens, request.pkgId).then(sendResponse);

        } else if (request.type === 'lookup-dictionary') {
            lookUpDictionary(request.keys, request.pkgId).then(sendResponse);
        } else if (request.type === 'get-frequency') {
            getFrequency(request.keys, request.pkgId).then(sendResponse);

        } else if (request.type === 'get-tab') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendResponse(tabs[0]);
            });
        } else if (request.type === 'search') {
            search(request.pkgId, request.key).then(sendResponse);
        } else if (request.type === 'search-all-batch') {
            searchAllBatch(request.pkgId, request.lemmasBatch).then(sendResponse);

        } else if (request.type === 'update-entry') {
            updateEntry(request.entry).then(sendResponse);
        } else if (request.type === 'clear-entries') {
            clearEntries().then(sendResponse);
        } else if (request.type === 'list-entries') {
            listEntries(request.pkgId, request.state).then(sendResponse);
        } else if (request.type === 'get-entry-stats') {
            getEntryStats(request.pkgId).then(sendResponse);
        } else if (request.type === 'import-user-data') {
            importUserData(request.data).then(sendResponse);
        } else if (request.type === 'export-user-data') {
            exportUserData().then(sendResponse);

        } else if (request.type === 'import-trie') {
            importTrie(request.pkgId, request.data).then(sendResponse);
        } else if (request.type === 'import-index') {
            importIndex(request.pkgId, request.data).then(sendResponse);
        } else if (request.type === 'import-dictionary') {
            let key = [request.pkgId, request.n].join(',');
            importDictionary(key, request.data).then(sendResponse);
        } else if (request.type === 'import-lemmatizer') {
            importLemmatizer(request.pkgId, request.data).then(sendResponse);
        } else if (request.type === 'import-entries') {
            importEntries(request.pkgId, request.data).then(sendResponse);
        } else if (request.type === 'update-package') {
            updatePackage(request.pkg).then(sendResponse);

        } else if (request.type === 'get-packages') {
            getPackages().then(sendResponse);
        } else if (request.type === 'get-package') {
            getPackage(request.pkgId).then(sendResponse);
        } else if (request.type === 'set-last-package') {
            setLastPackage(request.pkgId).then(sendResponse);
        } else if (request.type === 'get-last-package-id') {
            getLastPackageID().then(sendResponse);
        }

        return true;
    }
);

// handlers of commands
chrome.commands.onCommand.addListener((command: string) => {
    chrome.tabs.query({ active: true, currentWindow: true },
        (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id!, { type: command });
            }
        });
});

/**
 * Enable on install.
 */
chrome.runtime.onInstalled.addListener(() => {
    enable();
});

addBrowserAction();
createContextMenu();