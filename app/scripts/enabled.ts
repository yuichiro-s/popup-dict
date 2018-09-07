export type Message = 'enable' | 'disable';

let enabled = false;

function sendMessageToAllTabs(msg: Message) {
    chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, msg);
            }
        }
    });
}

export function enable() {
    chrome.browserAction.setBadgeText({ 'text': 'On' });
    enabled = true;
    sendMessageToAllTabs('enable');
    chrome.storage.local.set({ enabled: true });
    console.log('Enabled.');
}

export function disable() {
    chrome.browserAction.setBadgeText({ 'text': '' });
    enabled = false;
    sendMessageToAllTabs('disable');
    chrome.storage.local.set({ enabled: false });
    console.log('Disabled.');
}

export function isEnabled() {
    return enabled;
}

export function initEnabled() {
    chrome.browserAction.setBadgeBackgroundColor({
        'color': 'red'
    });
    chrome.storage.local.get(['enabled'], (data) => {
        enabled = data['enabled'];
        if (enabled) {
            enable();
        }
    });
}