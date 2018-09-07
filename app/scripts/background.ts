import 'chromereload/devonly';
import { SearchResults, search } from './search';
import { setLanguage, getLanguage } from './language';
import { Command } from './command';

export type Message = 'enable' | 'disable';

function sendMessageToAllTabs(msg: Message) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, msg);
      }
    }
  });
}

chrome.browserAction.setBadgeBackgroundColor({
  'color': 'red'
});

function enable() {
  chrome.browserAction.setBadgeText({ 'text': 'On' });
  chrome.storage.local.set({ enabled: true }, () => {
    console.log('Enabled.');
    sendMessageToAllTabs('enable');
  });
}

function disable() {
  chrome.browserAction.setBadgeText({ 'text': '' });
  chrome.storage.local.set({ enabled: false }, () => {
    console.log('Disabled.');
    sendMessageToAllTabs('disable');
  });
}

function isEnabled(sendResponse: (value: boolean) => void) {
  chrome.storage.local.get(['enabled'], (data) => {
    let enabled: boolean = data['enabled'];
    sendResponse(enabled);
    console.log('Enabled:', enabled);
  });
}

/**
 * Handlers of commands from content scripts.
 */

chrome.runtime.onMessage.addListener(
  (request: Command, sender, sendResponse) => {
    console.log('Command:', request);
    if (request.type === 'search') {
      let results: SearchResults = search(request.query);
      sendResponse(results);
    } else if (request.type === 'set-language') {
      setLanguage(request.lang);
    } else if (request.type === 'get-language') {
      getLanguage(sendResponse);
    } else if (request.type === 'set-enabled') {
      request.value ? enable() : disable();
    } else if (request.type === 'toggle-enabled') {
      isEnabled((value) => value ? disable() : enable());
    } else if (request.type === 'is-enabled') {
      isEnabled(sendResponse);
    }
    return true;
  }
);

/**
 * Enable on install.
 */
chrome.runtime.onInstalled.addListener(() => {
  enable();
});