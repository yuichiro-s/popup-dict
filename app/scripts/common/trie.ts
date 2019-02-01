import { Entry } from './entry';

export type Span = {
    begin: number;
    end: number;
    key: string[];
    entry: Entry;
};