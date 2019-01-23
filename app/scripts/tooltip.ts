import { DictionaryItem } from './dictionary';

function createLemmaSpan(lemmaStr: string) {
    let lemmaSpan = document.createElement('span');
    lemmaSpan.classList.add('dictionary-entry-lemma');
    lemmaSpan.innerHTML = lemmaStr;
    return lemmaSpan;
}

function createDefSpan(defStr: string) {
    let defSpan = document.createElement('span');
    defSpan.classList.add('dictionary-entry-def');
    defSpan.innerHTML = defStr;
    return defSpan;
}

function createBullet() {
    let bullet = document.createElement('span');
    bullet.textContent = '►';
    bullet.classList.add('dictionary-def-bullet');
    return bullet;
}

export const CLASS_POPUP_DICTIONARY = 'popup-dictionary';

export function createToolTip(item: DictionaryItem) {
    let e = document.createElement('div');
    e.classList.add(CLASS_POPUP_DICTIONARY);
    for (let i = 0; i < item.defs!.length; i++) {
        let entryDiv = document.createElement('div');
        entryDiv.classList.add('dictionary-entry');

        let lemma = item.lemmas![i];
        entryDiv.appendChild(createLemmaSpan(lemma));

        // create defs
        let totalLength = 0;
        let defs = item.defs![i];
        for (let j = 0; j < defs.length; j++) {
            let def = defs[j];
            entryDiv.appendChild(createBullet());
            entryDiv.appendChild(createDefSpan(def));
            totalLength += def.length;
            if (totalLength > 300 && j < defs.length - 1) {
                // truncate
                let expandButton = document.createElement('span');
                expandButton.innerHTML = '[+]';
                expandButton.classList.add('dictionary-entry-expand');
                // TODO: currently this button cannot be pressed because the
                // tooltip gets hidden when as soon as another highlight gets
                // selected
                expandButton.addEventListener('click', () => {
                    // fully expand
                    entryDiv.innerHTML = '';
                    entryDiv.appendChild(createLemmaSpan(lemma));
                    for (let def of item.defs![i]) {
                        entryDiv.appendChild(createBullet());
                        entryDiv.appendChild(createDefSpan(def));
                    }
                });
                entryDiv.appendChild(expandButton);
                break;
            }
        }
        if (i > 0) {
            let hr = document.createElement('hr');
            hr.classList.add('dictionary-entry-separator');
            e.appendChild(hr);
        }
        e.appendChild(entryDiv);
    }
    return e;
}