import { Entry } from "./entry";

export interface ISpan {
    begin: number;
    end: number;
    key: string[];
    entry: Entry;
}
