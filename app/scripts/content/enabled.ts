import { sendCommand } from './command';
import { getPackage } from './package';

function notMatch(url: string, pattern: string): boolean {
    const matched = url.match(new RegExp(`^${pattern}$`)) !== null;
    if (matched) {
        console.log(`Pattern ${pattern} matched to ${url}.`);
    }
    return !matched;
}

export async function isEnabled(): Promise<boolean> {
    const enabled = await sendCommand({ 'type': 'is-enabled' });
    if (enabled) {
        const tab = await sendCommand({ type: 'get-tab' });
        const url = tab.url;
        let pkg = await getPackage();

        // make sure the URL matches no blacklisted pattern
        return pkg !== null && pkg.blacklist.every(pattern => notMatch(url, pattern));
    }
    else {
        return false;
    }
}