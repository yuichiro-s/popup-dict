import { PackageID } from './package';

export enum State {
    Unknown,
    Marked,
    Known
}
interface EntryKey {
    pkgId: PackageID;
    key: string;
}
export interface UnknownEntry extends EntryKey {
    state: State.Unknown;
}
export interface MarkedEntry extends EntryKey {
    state: State.Marked;
    date: number;
    source: {
        url: string;
        title: string;
    };
    context: {
        begin: number;
        end: number;
        text: string;
    };
}
export interface KnownEntry extends EntryKey {
    state: State.Known;
}
export type Entry = UnknownEntry | MarkedEntry | KnownEntry;