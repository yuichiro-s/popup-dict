import 'chromereload/devonly';
import {createPopup, removePopup} from './popupDialog';
import {addEventListeners, removeEventListeners} from './userInput';
import {Message} from './enabled';
import { sendCommand } from './command';

/**
 * Enable the plugin on this page.
 */
function enable() {
  createPopup();
  addEventListeners();
}

/**
 * Disable the plugin on this page.
 */
function disable() {
  removePopup();
  removeEventListeners();
}

/**
 * Message handler.
 */
chrome.runtime.onMessage.addListener(
  (message: Message) => {
    switch (message) {
      case 'enable':
        enable();
        break;
      case 'disable':
        disable();
        break;
    }
  });

/**
 * Enable the plugin on this page if the plugin has been enabled in the background script.
 */
sendCommand({'type': 'is-enabled'} , (enabled) => {
  if (enabled) {
    enable();
  }
});