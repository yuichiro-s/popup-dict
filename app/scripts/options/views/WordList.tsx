import * as React from "react";

import WithPackage from "../components/WithPackage";
import { Stats } from "../components/word-list/Stats";

export default () => {

    return <WithPackage>{({
        packageSelector: PackageSelector,
        currentPkg,
    }) => {
        let stats = null;
        if (currentPkg !== null) {
            stats = <Stats pkg={currentPkg} />;
        }

        return <div>
            <PackageSelector />
            {stats}
        </div>;
    }
    }</WithPackage>;
};
