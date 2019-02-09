import { IProgress } from "../common/importer";
import { importPackage } from "./importer";

function makeURL(file: File) {
    return URL.createObjectURL(file);
}

export async function loadEijiroFromFiles(
    eijiroFile: File,
    inflectionFile: File,
    frequencyFile: File,
    whitelistFile: File,
    progressFn: (progress: IProgress) => void) {

    return importPackage(
        {
            type: "import-eijiro",
            eijiro: makeURL(eijiroFile),
            frequency: makeURL(frequencyFile),
            inflection: makeURL(inflectionFile),
            whitelist: makeURL(whitelistFile),
        },
        progressFn,
    );
}
