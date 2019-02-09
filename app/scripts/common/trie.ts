export const NEXT = "n";
export const EXISTS = "e";

export interface ITrieNode {
    [NEXT]: {
        [c: string]: ITrieNode;
    };
    [EXISTS]: boolean;
}
