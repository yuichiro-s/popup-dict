export enum Language {
  Spanish = 'Spanish',
  English = 'English',
  German = 'German',
  Korean = 'Korean',
}

const DEFAULT_LANG = Language.Spanish;

let currentLanguage: Language = DEFAULT_LANG;

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang: string) {
  currentLanguage = (<any>Language)[lang];
  chrome.storage.local.set({ lang }, () => {
    console.log('Language set to', lang);
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