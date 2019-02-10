import { State } from "../common/entry";
import { IGlobalSettings } from "../common/global-settings";
import { sendCommand } from "./command";
import { HIGHLIGHT_TAG, stateToString } from "./highlighter";

const STYLE_TAG_ID = "highlighter-style-specifier";

export async function applyStyle() {
    const element = document.createElement("style");
    element.id = STYLE_TAG_ID;
    const globalSettings: IGlobalSettings = await sendCommand({ type: "get-global-settings" });
    const style = globalSettings.highlightStyle;
    const text = `
${HIGHLIGHT_TAG}[data-state='${stateToString(State.Unknown)}'] {
${style.unknown}
}

${HIGHLIGHT_TAG}[data-state='${stateToString(State.Marked)}'] {
${style.marked}
}

${HIGHLIGHT_TAG}[data-state='${stateToString(State.Known)}'] {
${style.known}
}

${HIGHLIGHT_TAG}:hover {
${style.hover}
}
    `;
    element.innerHTML = text;
    let head = document.head;
    if (head === null) {
        head = document.createElement("head");
        document.prepend(head);
    }
    head.appendChild(element);
}

export function removeStyle() {
    const element = document.getElementById(STYLE_TAG_ID);
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}
