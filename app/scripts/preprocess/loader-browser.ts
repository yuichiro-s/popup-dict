function loadFile(url: string, type: XMLHttpRequestResponseType): Promise<any> {
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
        x.send();
    });
}
export const loadText = (url: string) => loadFile(url, "text");
export const loadJSON = (url: string) => loadFile(url, "json");
