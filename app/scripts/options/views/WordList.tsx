import * as React from "react";

import WithPackage from "../components/WithPackage";
import Stats from "../components/word-list/Stats";
import WordTable from "../components/word-list/WordTable";

export default () => {

    return <WithPackage>{({
        packageSelector: PackageSelector,
        currentPkg,
    }) => {
        let stats = null;
        let wordTable = null;
        if (currentPkg !== null) {
            stats = <Stats pkg={currentPkg} />;
            wordTable = <WordTable pkg={currentPkg}/>;
        }

        return <div>
            <PackageSelector />
            {stats}
            {wordTable}
        </div>;
    }
    }</WithPackage>;
};
