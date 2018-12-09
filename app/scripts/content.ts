import { sendCommand, ContentCommand } from './command';
import { disable, enable, toggleMarked, toggleKnown } from './highlighter';
import { setLanguage } from './language';

function isEnabled() {
  return sendCommand({ 'type': 'is-enabled' });
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
      if (message.type === 'set-language') {
        setLanguage(message.lang);
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
