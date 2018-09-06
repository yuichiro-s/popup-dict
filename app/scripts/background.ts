import 'chromereload/devonly';
import { SearchResults, search } from './search';

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
  chrome.storage.local.set({ enabled: true });
  sendMessageToAllTabs('enable');

  console.log('Enabled.');
}

function disable() {
  chrome.browserAction.setBadgeText({ 'text': '' });
  chrome.storage.local.set({ enabled: false });
  sendMessageToAllTabs('disable');

  console.log('Disabled.');
}

/**
 * Handlers of commands from content scripts.
 */

export type Command = { type: 'search', query: string };

chrome.runtime.onMessage.addListener(
  (request: Command, sender, sendResponse) => {
    if (request.type === 'search') {
      let results: SearchResults = search(request.query);
      sendResponse(results);
    }
  }
);

/**
 * Handlers of browser actions.
 */
chrome.browserAction.onClicked.addListener(() => {
  chrome.storage.local.get(['enabled'], (data) => {
    let enabled = !data.enabled;

    if (enabled) {
      enable();
    } else {
      disable();
    }
  });
});

/**
 * Enable on install.
 */
chrome.runtime.onInstalled.addListener(() => {
  enable();
});