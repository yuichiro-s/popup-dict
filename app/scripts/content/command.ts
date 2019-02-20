import { Command } from "../common/commands";

export function sendCommand(command: Command): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(command, (result) => {
            if (result.status === "ok") {
                resolve(result.data);
            } else {
                reject(result.data);
            }
        });
    });
}
