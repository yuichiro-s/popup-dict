export type Command =
  { type: 'search', query: string } |
  { type: 'set-language', lang: string } |
  { type: 'get-language' } |
  { type: 'toggle-enabled'} |
  { type: 'set-enabled', value: boolean } |
  { type: 'is-enabled' };

export function sendCommand(command: Command, callback?: (response: any) => void) {
    chrome.runtime.sendMessage(command, callback);
}