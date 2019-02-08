function loadFile(url: string, type: XMLHttpRequestResponseType): Promise<any> {
    return new Promise((resolve, reject) => {
        console.log(`Loading ${url} ...`);
        const x = new XMLHttpRequest();
        x.onload = () => {
            console.log(`Loaded ${url} .`);
            resolve(x.response);
        };
        x.onerror = reject;
        x.open('GET', url);
        x.responseType = type;
        x.send();
    });
}

export const loadText = (url: string) => loadFile(url, 'text');
export const loadJSON = (url: string) => loadFile(url, 'json');

export function loadInflection(content: string) {
    const inflection: {
        [form: string]: string;
    } = {};
    for (const line of content.split('\n')) {
        const [orig, form] = line.split('\t');
        inflection[form] = orig;
    }
    return inflection;
}

export function loadFrequency(content: string) {
    const rawFrequencyTable: {
        [form: string]: number;
    } = {};
    for (const line of content.split('\n')) {
        const [form, freqStr] = line.split(' ');
        rawFrequencyTable[form] = parseInt(freqStr);
    }
    return rawFrequencyTable;
}

export function loadWhitelist(content: string) {
    const whitelist = new Set<string>();
    for (const line of content.split('\n')) {
        whitelist.add(line);
    }
  return whitelist;
}
