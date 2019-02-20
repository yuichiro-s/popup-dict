import * as React from "react";

import ReactTable, { Column, Filter } from "react-table";
import "react-table/react-table.css";

import { IMarkedEntry, State } from "../../../common/entry";
import { IPackage, PackageID } from "../../../common/package";
import { sendCommand } from "../../../content/command";

interface Props {
    pkg: IPackage | null;
}

interface TableEntry {
    date: number;
    freq: number;
    key: string;
    keyDisplay: string;
    context: {
        before: string;
        word: string;
        after: string;
    };
    source: {
        url: string;
        title: string;
    };
    known: boolean;
    entry: IMarkedEntry;
}

interface Context {
    before: string;
    word: string;
    after: string;
}

function splitContext(text: string, begin: number, end: number): Context {
    let beforeStr = text.slice(0, begin);
    const word = text.slice(begin, end);
    let afterStr = text.slice(end);
    const MAX_LENGTH = 100;
    if (beforeStr.length >= MAX_LENGTH) {
        beforeStr = "... " + beforeStr.slice(beforeStr.length - MAX_LENGTH);
    }
    if (afterStr.length >= MAX_LENGTH) {
        afterStr = afterStr.slice(0, MAX_LENGTH) + " ...";
    }
    return {
        before: beforeStr,
        word,
        after: afterStr,
    };
}

async function getEntriesToShow(pkgId: PackageID) {
    const entries: IMarkedEntry[] = await sendCommand({
        type: "list-entries",
        pkgId,
        state: State.Marked,
    });
    const freqs = await sendCommand({
        type: "get-frequency",
        pkgId,
        keys: entries.map((entry) => entry.key),
    });
    const entryToFreq = new Map<IMarkedEntry, number>();
    for (let i = 0; i < freqs.length; i++) {
        entryToFreq.set(entries[i], freqs[i]);
    }
    return { entries, entryToFreq };
}

function createTableEntry(pkg: IPackage, entry: IMarkedEntry, entryToFreq: Map<IMarkedEntry, number>) {
    const freq = entryToFreq.get(entry) || 0;
    return {
        date: entry.date,
        freq,
        key: entry.key,
        keyDisplay: pkg.tokenizeByWhiteSpace
            ? entry.key
            : entry.key.replace(/ /g, ""),
        context: splitContext(
            entry.context.text,
            entry.context.begin,
            entry.context.end,
        ),
        source: entry.source,
        known: false,
        entry,
    };
}

export default ({ pkg }: Props) => {
    const [entries, setEntries] = React.useState<IMarkedEntry[]>([]);
    const [entryToFreq, setEntryToFreq] = React.useState<Map<IMarkedEntry, number>>(new Map());
    const [loading, setLoading] = React.useState<boolean>(false);

    React.useEffect(() => {
        setLoading(true);
        if (pkg !== null) {
            getEntriesToShow(pkg.id).then(({ entries: newEntries, entryToFreq: newEntryToFreq }) => {
                setEntries(newEntries);
                setEntryToFreq(newEntryToFreq);
                setLoading(false);
            });
        }
    }, [pkg]);

    if (pkg === null) {
        return null;
    } else {
        const items: TableEntry[] = [];
        for (const entry of entries) {
            items.push(createTableEntry(pkg, entry, entryToFreq));
        }

        const columns: Column[] = [
            {
                Header: "Date",
                accessor: "date",
                sortable: true,
                width: 100,
                Cell: (row) => <div>{new Date(row.value).toLocaleDateString()}</div>,
            },
            {
                Header: "Freq",
                accessor: "freq",
                sortable: true,
                width: 100,
            },
            {
                Header: "Key",
                accessor: "key",
                sortable: true,
                filterable: true,
                filterMethod: ({ value }: Filter, row: TableEntry) => row.key.includes(value),
                width: 200,
            },
            {
                Header: "Context",
                accessor: "context",
                Cell: (row) => {
                    const { before, word, after } = row.value as Context;
                    return <div>
                        <span>{before}</span>
                        <span style={{ color: "red" }}>{word}</span>
                        <span>{after}</span>
                    </div>;
                },
                style: { whiteSpace: "unset" },
            },
        ];

        return <ReactTable
            columns={columns}
            data={items}
            loading={loading}
            pageSizeOptions={[100, 500, 1000]}
            defaultPageSize={100}
            defaultSortDesc={true}
            defaultSorted={[{ id: "date", desc: true }]}
        />;
    }
};
