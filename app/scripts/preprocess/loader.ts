export function loadInflection(content: string) {
    const inflection: {
        [form: string]: string;
    } = {};
    for (const line of content.split("\n")) {
        const [orig, form] = line.split("\t");
        inflection[form] = orig;
    }
    return inflection;
}

export function loadFrequency(content: string) {
    const rawFrequencyTable: {
        [form: string]: number;
    } = {};
    for (const line of content.split("\n")) {
        const [form, freqStr] = line.split(" ");
        rawFrequencyTable[form] = parseInt(freqStr, 10);
    }
    return rawFrequencyTable;
}

export function loadWhitelist(content: string) {
    const whitelist = new Set<string>();
    for (const line of content.split("\n")) {
        whitelist.add(line);
    }
    return whitelist;
}
