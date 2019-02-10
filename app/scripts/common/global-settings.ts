export interface IGlobalSettings {
    blacklistedLanguages: string[];
    blacklistedURLPatterns: string[];
    highlightStyle: {
        marked: string;
        unknown: string;
        known: string;
        hover: string;
    };
}

export const INITIAL_HIGHLIGHT_STYLE = {
    unknown: "background-color: rgba(238, 238, 119, 0.5);",
    marked: "background-color: rgba(238, 119, 119, 0.5);",
    known: "",
    hover: "filter: contrast(70%) brightness(130%);",
};

export const INITIAL_GLOBAL_SETTINGS: IGlobalSettings = {
    blacklistedLanguages: [],
    blacklistedURLPatterns: [],
    highlightStyle: INITIAL_HIGHLIGHT_STYLE,
};
