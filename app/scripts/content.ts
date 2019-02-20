import { messageHandler } from "./content/contentCommand";
import { isEnabled } from "./content/enabled";
import { enable } from "./content/highlighter";

/**
 * Message handler.
 */
chrome.runtime.onMessage.addListener(messageHandler);

/**
 * Enable the plugin on this page if the plugin has been enabled in the background script.
 */
(async () => {
    const enabled = await isEnabled();
    if (enabled) {
        enable();
    }
})();
