export const NEXT = 'n';
export const EXISTS = 'e';

export type TrieNode = {
    [NEXT]: {
        [c: string]: TrieNode;
    };
    [EXISTS]: boolean;
};