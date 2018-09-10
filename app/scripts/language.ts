import 'chromereload/devonly';

import { loadDictionaries } from './dictionary';
import { Language } from './languages';

const DEFAULT_LANG = Language.Spanish;

let currentLanguage: Language = DEFAULT_LANG;

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang: string) {
  currentLanguage = (<any>Language)[lang];
  chrome.storage.local.set({ lang }, () => {
    console.log('Language set to', lang);

    // load dictionaries
    loadDictionaries(currentLanguage);
  });
}

export function initLanguage() {
  chrome.storage.local.get(['lang'], (data) => {
    let lang = data.lang;
    if (!lang) {
      lang = DEFAULT_LANG;
    }
    setLanguage(lang);
  });
}