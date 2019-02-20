import * as React from "react";

import Button from "@material-ui/core/Button";
import Slider from "@material-ui/lab/Slider";
import { debounce } from "lodash-es";
import ReactTable, { Column } from "react-table";
import "react-table/react-table.css";
import { toast } from "react-toastify";

import { Entry, IKnownEntry, State } from "../../common/entry";
import { IPackage, PackageID } from "../../common/package";
import { sendCommand } from "../../content/command";
import WithPackage from "../components/WithPackage";

interface TableEntry {
    freq: number;
    rank: number;
    key: string;
    keyDisplay: string;
    entry: Entry;
}

const MAX_RANK = 20000;

async function getEntriesToShow(pkgId: PackageID) {
    const entries: Entry[] = await sendCommand({
        type: "list-entries",
        pkgId,
    });
    const freqs = await sendCommand({
        type: "get-frequency",
        pkgId,
        keys: entries.map((entry) => entry.key),
    });
    const entryToFreq = new Map<Entry, number>();
    for (let i = 0; i < freqs.length; i++) {
        entryToFreq.set(entries[i], freqs[i]);
    }
    return { entries, entryToFreq };
}

interface Props {
    pkg: IPackage;
}

interface TableEntry {
    freq: number;
    rank: number;
    key: string;
    keyDisplay: string;
    entry: Entry;
}

const WordFilter = ({ pkg }: Props) => {
    const [tableEntries, setTableEntries] = React.useState<TableEntry[]>([]);
    const [tableEntriesToShow, setTableEntriesToShow] = React.useState<TableEntry[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [rank, setRank] = React.useState<number>(1);
    const [rankDebounce, setRankDebounce] = React.useState<number>(1);

    React.useEffect(() => {
        setLoading(true);
        getEntriesToShow(pkg.id).then(({ entries, entryToFreq }) => {
            const entriesWithFreq = [];
            for (const entry of entries) {
                if (entryToFreq.has(entry)) {
                    const freq = entryToFreq.get(entry)!;
                    entriesWithFreq.push({
                        freq,
                        entry,
                    });
                }
            }
            entriesWithFreq.sort((a, b) => b.freq - a.freq);
            const newTableEntries: TableEntry[] = [];
            for (let i = 0; i < Math.min(entriesWithFreq.length, MAX_RANK); i++) {
                const entryWithFreq = entriesWithFreq[i];
                const entry = entryWithFreq.entry;
                const keyDisplay = pkg.tokenizeByWhiteSpace
                    ? entry.key
                    : entry.key.replace(/ /g, "");
                newTableEntries.push({
                    freq: entryWithFreq.freq,
                    rank: i + 1,
                    key: entry.key,
                    keyDisplay,
                    entry,
                });
            }

            setTableEntries(newTableEntries);
            setLoading(false);
        });
    }, [pkg]);

    React.useEffect(() => {
        setTableEntriesToShow(tableEntries.slice(0, rankDebounce).reverse());
    }, [tableEntries, rank]);

    const columns: Column[] = [
        {
            Header: "Rank",
            accessor: "rank",
            width: 100,
        },
        {
            Header: "Freq",
            accessor: "freq",
            width: 100,
        },
        {
            Header: "Key",
            accessor: "keyDisplay",
        },
    ];

    const changeRankDebounce = debounce((value: number) => {
        setRankDebounce(value);
    }, 1000);

    const handleChange = (event: any, value: number) => {
        setRank(value);
        changeRankDebounce(value);
    };

    const handleClick = () => {
        const n = tableEntriesToShow.length;
        if (confirm(`Are you sure you want to mark ${n} entries as known? This action cannot be undone.`)) {
            const entries: IKnownEntry[] = [];
            for (const tableEntry of tableEntriesToShow) {
                const entry = tableEntry.entry;
                const newEntry: IKnownEntry = {
                    pkgId: entry.pkgId,
                    key: entry.key,
                    state: State.Known,
                };
                entries.push(newEntry);
            }
            sendCommand({ type: "update-entries", entries }).then(() => {
                toast.success(`Successfully marked ${n} entries as known.`);
            });
        }
    };

    return <div>
        <Slider
            value={rank}
            onChange={handleChange}
            min={1}
            max={Math.min(tableEntries.length, MAX_RANK)}
            step={1}
        />;
        <Button onClick={handleClick}>Mark as known</Button>

        <ReactTable
            columns={columns}
            data={tableEntriesToShow}
            loading={loading}
            defaultPageSize={100}
        />;
    </div>;
};

export default () => <WithPackage>{({
    packageSelector: PackageSelector,
    currentPkg: pkg,
}) => {
    let content = null;
    if (pkg !== null) {
        content = <WordFilter pkg={pkg} />;
    }

    return <div>
        <PackageSelector />
        {content}
    </div>;
}
}</WithPackage>;
