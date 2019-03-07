function loadFile(url: string, type: XMLHttpRequestResponseType, encoding?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        console.log(`Loading ${url} ...`);
        const x = new XMLHttpRequest();
        x.onload = () => {
            console.log(`Loaded ${url} .`);
            resolve(x.response);
        };
        x.onerror = reject;
        x.open("GET", url);
        x.responseType = type;
        if (encoding !== undefined) {
            x.overrideMimeType(`text/plain; charset=${encoding}`);
        }
        x.send();
    });
}
export const loadText = (url: string, encoding?: string) => loadFile(url, "text", encoding);
export const loadJSON = (url: string) => loadFile(url, "json");
