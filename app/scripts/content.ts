import { sendCommand, ContentCommand } from './command';
import { disable, enable, toggleMarked, toggleKnown } from './highlighter';
import { setPackageID, getPackage } from './package';


function notMatch(url: string, pattern: string): boolean {
    const matched = url.match(new RegExp(`^${pattern}$`)) !== null;
    if (matched) {
        console.log(`Pattern ${pattern} matched to ${url}.`);
    }
    return !matched;
}

async function isEnabled(): Promise<boolean> {
    const enabled = await sendCommand({ 'type': 'is-enabled' });
    if (enabled) {
        const tab = await sendCommand({ type: 'get-tab' });
        const url = tab.url;
        let pkg = await getPackage();
        return pkg !== null && pkg.blacklist.every(pattern => notMatch(url, pattern));
    } else {
        return false;
    }
}

/**
 * Message handler.
 */
chrome.runtime.onMessage.addListener(async (message: ContentCommand) => {
    if (message.type === 'enable') {
        enable();
    } else if (message.type === 'disable') {
        disable();
    } else {
        let enabled = await isEnabled();
        if (enabled) {
            if (message.type === 'set-package-id') {
                await setPackageID(message.pkgId);
                disable();
                enable();
            } else if (message.type === 'toggle-marked') {
                toggleMarked();
            } else if (message.type === 'toggle-known') {
                toggleKnown();
            }
        }
    }
});

/**
 * Enable the plugin on this page if the plugin has been enabled in the background script.
 */
(async () => {
    let enabled = await isEnabled();
    if (enabled) {
        enable();
    }
})();
