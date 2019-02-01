import { sendContentCommand } from './command';
import { getPackages } from './packages';

export async function createContextMenu() {
    let parentMenuItem = chrome.contextMenus.create({ title: 'Highlighter' });

    // TODO: get packages
    let packages = await getPackages();
    for (let pkgId in packages) {
        let pkg = packages[pkgId];
        chrome.contextMenus.create({
            title: pkg.name,
            parentId: parentMenuItem,
            onclick: (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
                sendContentCommand({ type: 'set-package-id', pkgId: pkg.id }, tab.id!);
            },
        });
    }
}