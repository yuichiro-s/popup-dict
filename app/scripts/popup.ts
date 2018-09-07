import 'chromereload/devonly';
import { createNodeFromString } from './util';
import { languages } from './language';
import { sendCommand } from './command';

let toggleEnableCheckBox = <HTMLInputElement>document.getElementById('toggle-enable-check-box');
toggleEnableCheckBox.addEventListener('change', () => {
    sendCommand({ type: 'set-enabled', value: toggleEnableCheckBox.checked });
});
sendCommand({ type: 'is-enabled' }, (value: boolean) => {
    toggleEnableCheckBox.checked = value;
});

let languageBox = <HTMLSelectElement>document.getElementById('language-box');
for (let language of languages) {
    let option = createNodeFromString(`<option value="${language}">${language}</option>`);
    languageBox.appendChild(option);
}
languageBox.addEventListener('change', (e) => {
    let lang = languageBox.value;
    chrome.runtime.sendMessage({ type: 'set-language', lang });
});
sendCommand({ type: 'get-language' }, (lang: string) => {
    languageBox.value = lang;
});