import { IGlobalSettings } from "../common/global-settings";
import { sendCommand } from "./command";

function notMatch(url: string, pattern: string): boolean {
    if (pattern.trim().length === 0) { return true; }
    const matched = url.match(new RegExp(`${pattern}`)) !== null;
    if (matched) {
        console.log(`Pattern ${pattern} matched to ${url}.`);
    }
    return !matched;
}

export async function isEnabled(): Promise<boolean> {
    const enabled = await sendCommand({ type: "is-enabled" });
    if (enabled) {
        const tab = await sendCommand({ type: "get-tab" });
        const url = tab.url;

        const globalSettings: IGlobalSettings = await sendCommand({ type: "get-global-settings" });
        const patterns = globalSettings.blacklistedURLPatterns;

        // make sure the URL matches no blacklisted pattern
        return patterns.every((pattern) => notMatch(url, pattern));
    } else {
        return false;
    }
}
