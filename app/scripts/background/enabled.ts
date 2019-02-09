import { sendContentCommand } from "./command";

export function enable() {
    chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
    chrome.browserAction.setBadgeText({ text: "On" });
    chrome.storage.local.set({ enabled: true });
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => sendContentCommand({ type: "enable" }, tab.id!));
    });
    console.log("Enabled.");
}

export function disable() {
    chrome.browserAction.setBadgeText({ text: "" });
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => sendContentCommand({ type: "disable" }, tab.id!));
    });
    chrome.storage.local.set({ enabled: false });
    console.log("Disabled.");
}

export function isEnabled() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["enabled"], (data) => {
            const enabled = data.enabled;
            resolve(enabled);
        });
    });
}

export function addBrowserAction() {
    chrome.browserAction.onClicked.addListener(async () => {
        if (await isEnabled()) {
            disable();
        } else {
            enable();
        }
    });
}
