import { Language, GERMAN, CHINESE, ENGLISH } from './languages';
import { disable, enable } from './highlighter';
import { all } from 'franc';

let currentLanguage: Language | null = null;

let map = new Map<string, string>([
    ['deu', GERMAN],
    ['eng', ENGLISH],
    ['cmn', CHINESE],
]);

function guessLanguage(): Language {
    let texts: string[] = [];
    function dfs(element: Element) {
        if (element.tagName !== 'SCRIPT') {
            let nodes = element.childNodes;
            for (let j = 0; j < nodes.length; j++) {
                let node = nodes[j];
                if (node.nodeType === Node.TEXT_NODE) {
                    texts.push(node.textContent!);
                }
            }
        }
        for (let i = 0; i < element.children.length; i++) {
            dfs(element.children[i]);
        }
    }
    dfs(document.body);
    let text = texts.join('\n');
    if (text.length < 20) {
        return ENGLISH;
    } else {
        let guess = all(text, { whitelist: Array.from(map.keys()) });
        let lang = map.get(guess[0][0])!;
        let confidence = guess[0][1];
        console.log(`Guessed language: ${lang} (confidence = ${confidence})`);
        return lang;
    }
}

export function setLanguage(lang: Language) {
    currentLanguage = lang;
    // re-highlight
    disable();
    enable();
}

export function getLanguage(): Language {
    if (currentLanguage === null) {
        currentLanguage = guessLanguage();
    }
    return currentLanguage!;
}