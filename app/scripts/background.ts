import 'chromereload/devonly';
import { SearchResults, search } from './search';
import { setLanguage, getLanguage, initLanguage } from './language';
import { Command } from './command';
import { enable, disable, isEnabled, initEnabled } from './enabled';

/**
 * Handlers of commands from content scripts.
 */
chrome.runtime.onMessage.addListener(
  (request: Command, sender, sendResponse) => {
    console.log('Command:', request);
    if (request.type === 'search') {
      let results: SearchResults = search(request.query);
      sendResponse(results);
    } else if (request.type === 'set-language') {
      setLanguage(request.lang);
    } else if (request.type === 'get-language') {
      sendResponse(getLanguage());
    } else if (request.type === 'set-enabled') {
      request.value ? enable() : disable();
    } else if (request.type === 'toggle-enabled') {
      isEnabled() ? disable() : enable();
    } else if (request.type === 'is-enabled') {
      sendResponse(isEnabled());
    }
    return true;
  }
);

/**
 * Enable on install.
 */
chrome.runtime.onInstalled.addListener(() => {
  enable();
});

/**
 * Initialize states.
 */
initLanguage();
initEnabled();