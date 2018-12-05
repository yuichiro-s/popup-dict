import { sendCommand, ContentCommand } from './command';
import { disable, enable, toggleMarked, toggleKnown } from './highlighter';
import { setLanguage } from './language';

/**
 * Message handler.
 */
chrome.runtime.onMessage.addListener((message: ContentCommand) => {
  if (message.type === 'enable') {
    enable();
  } else if (message.type === 'disable') {
    disable();
  } else if (message.type === 'toggle-marked') {
    toggleMarked();
  } else if (message.type === 'toggle-known') {
    toggleKnown();
  } else if (message.type === 'set-language') {
    setLanguage(message.lang);
  }
});

/**
 * Enable the plugin on this page if the plugin has been enabled in the background script.
 */
(async () => {
  let enabled = await sendCommand({ 'type': 'is-enabled' });
  if (enabled) {
    enable();
  }
})();
