import { createContextMenu } from './contextmenu';
import { Command } from './command';
import { enable, isEnabled, addBrowserAction } from './enabled';
import { lemmatize } from './lemmatizer';
import { lookUpDictionary } from './dictionary';
import { search, searchAllBatch } from './trie';
import { updateEntry, listEntries, clearEntries, importEntries, exportEntries } from './entry';

/**
 * Handlers of commands from content scripts.
 */
chrome.runtime.onMessage.addListener(
  (request: Command, sender, sendResponse) => {
    if (request.type === 'is-enabled') {
      isEnabled().then(sendResponse);

    } else if (request.type === 'lemmatize') {
      lemmatize(request.tokens, request.lang).then(sendResponse);
    } else if (request.type === 'lookup-dictionary') {
      lookUpDictionary(request.keys, request.lang).then(sendResponse);
    } else if (request.type === 'get-tab') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse(tabs[0]);
      });
    } else if (request.type === 'search') {
      search(request.lang, request.key).then(sendResponse);
    } else if (request.type === 'search-all-batch') {
      searchAllBatch(request.lang, request.lemmasBatch, request.lookUpDictionary).then(sendResponse);

    } else if (request.type === 'update-entry') {
      updateEntry(request.entry).then(sendResponse);
    } else if (request.type === 'clear-entries') {
      clearEntries().then(sendResponse);
    } else if (request.type === 'list-entries') {
      listEntries(request.lang, request.state).then(sendResponse);
    } else if (request.type === 'import-entries') {
      importEntries(request.data).then(sendResponse);
    } else if (request.type === 'export-entries') {
      exportEntries().then(sendResponse);
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