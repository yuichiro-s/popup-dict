import * as React from "react";

import { IStats } from "../../../background/stats";
import { IPackage } from "../../../common/package";
import { sendCommand } from "../../../content/command";

interface Props {
    pkg: IPackage;
}

export default ({ pkg }: Props) => {
    const [stats, setStats] = React.useState<IStats | null>(null);
    React.useEffect(() => {
        if (pkg !== null) {
            sendCommand({
                type: "get-stats",
                pkgId: pkg.id,
            }).then((newStats: IStats) => {
                setStats(newStats);
            });
        }
    }, [pkg]);
    if (stats !== null) {
        return <div>
            <span>Known: {stats.knownCount}</span>
            <span style={{ marginLeft: "10px" }}>Marked: {stats.markedCount}</span>
        </div>;
    } else {
        return null;
    }
};
