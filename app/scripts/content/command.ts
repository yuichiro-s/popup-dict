import { Command, ContentCommand } from '../common/commands';
import { disable, enable, toggleMarked, toggleKnown } from './highlighter';
import { setPackageID } from './package';
import { isEnabled } from './enabled';

export function sendCommand(command: Command): Promise<any> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(command, (result) => resolve(result));
    });
}

export const messageHandler = async (message: ContentCommand) => {
    if (message.type === 'enable') {
        enable();
    } else if (message.type === 'disable') {
        disable();
    } else {
        isEnabled().then(enabled => {
            if (enabled) {
                if (message.type === 'set-package-id') {
                    setPackageID(message.pkgId).then(() => {
                        disable();
                        enable();
                    });
                } else if (message.type === 'toggle-marked') {
                    toggleMarked();
                } else if (message.type === 'toggle-known') {
                    toggleKnown();
                }
            }

        });
    }
};