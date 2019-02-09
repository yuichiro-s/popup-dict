import { messageHandler } from "./background/command";
import { createContextMenu } from "./background/contextmenu";
import { addBrowserAction, enable } from "./background/enabled";
import { importerHandler } from "./background/importer";
import { saveStats } from "./background/stats";

chrome.runtime.onMessage.addListener(messageHandler);
chrome.runtime.onConnect.addListener(importerHandler);

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

// record number of known/marked words on start-up
saveStats();
