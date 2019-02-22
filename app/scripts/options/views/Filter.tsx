import * as React from "react";

import Button from "@material-ui/core/Button";
import Slider from "@material-ui/lab/Slider";
import { toast } from "react-toastify";
import "react-virtualized/styles.css";

import { CircularProgress } from "@material-ui/core";
import { AutoSizer, List } from "react-virtualized";
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
    keyDisplay: string;
}

const WordFilter = ({ pkg }: Props) => {
    const [tableEntries, setTableEntries] = React.useState<TableEntry[]>([]);
    const [tableEntriesToShow, setTableEntriesToShow] = React.useState<TableEntry[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [rank, setRank] = React.useState<number>(100);

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
        setTableEntriesToShow(tableEntries.slice(0, rank).reverse());
    }, [tableEntries, rank]);

    const handleChange = (event: any, value: number) => {
        setRank(value);
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

    const slider = <Slider
        value={rank}
        onChange={handleChange}
        min={1}
        max={Math.min(tableEntries.length, MAX_RANK)}
        step={1}
    />;
    const button = <Button onClick={handleClick} variant="outlined">Mark as known</Button>;
    const table = <AutoSizer>
        {({ height, width }) => (
            <List
                width={width}
                height={height}
                rowHeight={14}
                rowCount={tableEntriesToShow.length}
                rowRenderer={
                    ({ key, index, style }) => {
                        const e = tableEntriesToShow[index];
                        return <div key={key} style={style}>
                            <span style={{ color: "grey" }}>#{e.rank} (freq={e.freq})</span> <b>{e.key}</b>
                        </div>;
                    }
                }
            />
        )}
    </AutoSizer>;

    if (loading) {
        return <div style={{ margin: 20 }}>
            <CircularProgress variant="indeterminate" />
        </div>;
    } else {
        return (<React.Fragment>
            <div style={{ marginTop: 40 }}>
                <h2>Step 2: Set the threshold of frequency</h2>
                <div>
                    <p>Set the threshold using the slider below</p>
                    <div style={{ width: "50%", padding: 20 }}>
                        {slider}
                    </div>
                </div>
                <div>
                    <p>The {rank} most frequent words will be marked as known. (listed below)</p>
                    <div style={{ width: 300, height: 300 }}>
                        {table}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 40 }}>
                <h2>Step 3: Mark the selected words as known</h2>
                {button}
            </div>
        </React.Fragment>);
    }
};

export default () => <WithPackage>{({
    packageSelector: PackageSelector,
    currentPkg: pkg,
}) => {

    let step2 = null;
    if (pkg !== null) {
        step2 = <WordFilter pkg={pkg} />;
    }

    return <div>
        <h1>Mark most frequent words as known</h1>

        <div style={{ marginTop: 40 }}>
            <h2>Step 1: Select the dictionary</h2>
            <PackageSelector />
        </div>

        {step2}
    </div>;
}
}</WithPackage>;
