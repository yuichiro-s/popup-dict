import * as React from "react";

import { IMarkedEntry, State } from "../../../common/entry";
import { IPackage } from "../../../common/package";
import { sendCommand } from "../../../content/command";

interface Props {
    pkg: IPackage | null;
}

export default ({ pkg }: Props) => {
    const [entries, setEntries] = React.useState<IMarkedEntry[]>([]);

    React.useEffect(() => {
        if (pkg !== null) {
            sendCommand({
                type: "list-entries",
                pkgId: pkg.id,
                state: State.Marked,
            }).then((newEntries: IMarkedEntry[]) => {
                setEntries(newEntries);
            });
        }
    }, [pkg]);

    const items = [];
    for (const entry of entries) {
        items.push(<li key={entry.key}>{JSON.stringify(entry)}</li>);
    }

    return <div><ul>{items}</ul></div>;
};
