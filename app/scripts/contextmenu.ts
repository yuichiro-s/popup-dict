import { SUPPORTED_LANGUAGES } from './languages';
import { sendContentCommand } from './command';

export function createContextMenu() {
    let parentMenuItem = chrome.contextMenus.create({ title: 'Highlighter' });

    for (let lang of SUPPORTED_LANGUAGES) {
        chrome.contextMenus.create({
            title: lang,
            parentId: parentMenuItem,
            onclick: (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
                sendContentCommand({ type: 'set-language', lang }, tab.id!);
            },
        });
    }
}