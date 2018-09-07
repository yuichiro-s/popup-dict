import 'chromereload/devonly';
import { createNodeFromString } from './util';
import { Language } from './language';
import { sendCommand } from './command';

// initialize check box value
let toggleEnableCheckBox = <HTMLInputElement>document.getElementById('toggle-enable-check-box');
sendCommand({ type: 'is-enabled' }, (value: boolean) => {
    toggleEnableCheckBox.checked = value;
    toggleEnableCheckBox.addEventListener('change', () => {
        sendCommand({ type: 'set-enabled', value: toggleEnableCheckBox.checked });
    });
});

// initialize language selector
let languageBox = <HTMLSelectElement>document.getElementById('language-box');
for (let language in Language) {
    let option = createNodeFromString(`<option value="${language}">${language}</option>`);
    languageBox.appendChild(option);
}
sendCommand({ type: 'get-language' }, (lang: string) => {
    languageBox.value = lang;
    languageBox.addEventListener('change', (e) => {
        let lang = languageBox.value;
        sendCommand({ type: 'set-language', lang });
    });
});