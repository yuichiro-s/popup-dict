import { createContextMenu } from './background/contextmenu';
import { enable, addBrowserAction } from './background/enabled';
import { messageHandler } from './background/command';
import { saveStats } from './background/stats';

chrome.runtime.onMessage.addListener(messageHandler);

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