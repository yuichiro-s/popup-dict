import { ISettings } from "./package";

export type ImportMessage =
    {
        type: "import-files",
        settings: ISettings,
        trie: string,
        lemmatizer: string,
        index: string,
        subDicts: { [index: number]: string },
        frequency: string,
    } | {
        type: "import-eijiro",
        eijiro: string,
        inflection: string,
        frequency: string,
        whitelist: string,
    };

export interface IProgress {
    ratio: number;
    msg: string;
}
