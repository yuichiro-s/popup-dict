import { isEnabled } from './content/enabled';
import { messageHandler } from './content/command';
import { enable } from './content/highlighter';

/**
 * Message handler.
 */
chrome.runtime.onMessage.addListener(messageHandler);

/**
 * Enable the plugin on this page if the plugin has been enabled in the background script.
 */
(async () => {
    let enabled = await isEnabled();
    if (enabled) {
        enable();
    }
})();
