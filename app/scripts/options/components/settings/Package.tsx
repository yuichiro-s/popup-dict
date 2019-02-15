import * as React from "react";

import { MenuItem, Select } from "@material-ui/core";
import { cloneDeep } from "lodash-es";

import { IPackage, ShowDictionary } from "../../../common/package";
import WithPackage from "../WithPackage";
import DeletePackageButton from "./DeletePackageButton";
import ImportEijiroButton from "./ImportEijiroButton";
import ImportPackageButton from "./ImportPackageButton";

export default () => {
    const showDictionaryItems = [
        { text: "Always", value: "always" },
        { text: "Unknown or Marked", value: "unknown-or-marked" },
        { text: "Never", value: "never" },
    ].map(({ text, value }) => <MenuItem value={value} key={text}>{text}</MenuItem>);

    return <WithPackage>{({
        packageSelector: PackageSelector,
        currentPkg,
        reloadPackagesAndSetCurrentPkgId,
        updatePackage,
    }) => {
        const onImportDone = (pkg: IPackage) => {
            reloadPackagesAndSetCurrentPkgId(pkg.id);
        };
        const onDeleteDone = () => {
            reloadPackagesAndSetCurrentPkgId("");
        };
        const handleShowDictionaryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
            const newPkg = cloneDeep(currentPkg!);
            newPkg.showDictionary = event.target.value as ShowDictionary;
            updatePackage(newPkg);
        };

        return <React.Fragment>
            <ImportPackageButton onDone={onImportDone} />
            <ImportEijiroButton onDone={onImportDone} />

            <h2>Manage Packages</h2>
            <p>Select package</p>

            <PackageSelector />

            {currentPkg && <div>
                <p>ID: {currentPkg.id}</p>
                <p>When to show the dictionary tooltip</p>
                <Select value={currentPkg.showDictionary} onChange={handleShowDictionaryChange}>
                    {showDictionaryItems}
                </Select>
                <DeletePackageButton pkg={currentPkg} onDone={onDeleteDone} />
            </div>}

        </React.Fragment>;
    }}
    </WithPackage>;
};
