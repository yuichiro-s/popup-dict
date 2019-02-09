import { PackageID } from "./package";

export enum State {
    Unknown,
    Marked,
    Known,
}
interface IEntryKey {
    pkgId: PackageID;
    key: string;
}
export interface IUnknownEntry extends IEntryKey {
    state: State.Unknown;
}
export interface IMarkedEntry extends IEntryKey {
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
export interface IKnownEntry extends IEntryKey {
    state: State.Known;
}
export type Entry = IUnknownEntry | IMarkedEntry | IKnownEntry;
