export let languages = [
    'Spanish',
    'English',
    'German',
    'Korean',
];

const DEFAULT_LANG = languages[0];

export function getLanguage(sendResponse: (lang: string) => void) {
  chrome.storage.local.get(['lang'], (data) => {
      let lang = data.lang;
      if (!lang) {
        setLanguage(DEFAULT_LANG);
        lang = DEFAULT_LANG;
      }
      sendResponse(lang);
      console.log('Language:', lang);
  });
}

export function setLanguage(lang: string) {
  chrome.storage.local.set({ lang }, () => {
    console.log('Language set to', lang);
  });
}