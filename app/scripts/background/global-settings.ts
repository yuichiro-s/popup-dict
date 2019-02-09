import { IGlobalSettings } from "../common/global-settings";

const KEY = "globalSettings";

const INITIAL_GLOBAL_SETTINGS = {
        blacklistedLanguages: [],
};

export function setGlobalSettings(newSettings: IGlobalSettings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [KEY]: newSettings }, () => { resolve(); });
    });
}

export function getGlobalSettings(): Promise<IGlobalSettings> {
    return new Promise((resolve) => {
        chrome.storage.local.get(KEY, (data) => {
            let globalSettings = data[KEY];
            if (globalSettings === undefined) {
                globalSettings = INITIAL_GLOBAL_SETTINGS;
            }
            resolve(globalSettings);
        });
    });
}
