import { keys } from "../common/objectmap";
import { sendContentCommand } from "./command";
import { getPackages } from "./packages";

export async function createContextMenu() {
    const parentMenuItem = chrome.contextMenus.create({ title: "Highlighter" });

    // TODO: get packages
    const packages = await getPackages();
    for (const pkgId of keys(packages)) {
        const pkg = packages[pkgId];
        chrome.contextMenus.create({
            title: pkg.name,
            parentId: parentMenuItem,
            onclick: (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
                sendContentCommand({ type: "set-package-id", pkgId: pkg.id }, tab.id!);
            },
        });
    }
}
