import * as React from "react";

import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
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

        let content = null;
        if (currentPkg !== null) {
            content = <div>
                <FormControl>
                    <InputLabel>When to show popup dictionary</InputLabel>
                    <Select value={currentPkg.showDictionary} onChange={handleShowDictionaryChange}>
                        {showDictionaryItems}
                    </Select>
                </FormControl>

                <p>
                    <DeletePackageButton pkg={currentPkg} onDone={onDeleteDone} />
                </p>
            </div>;
        }

        return <React.Fragment>
            <p>
                <ImportPackageButton onDone={onImportDone} />
            </p>
            <p>
                <ImportEijiroButton onDone={onImportDone} />
            </p>

            <h2>Configure Packages</h2>
            <FormControl>
                <InputLabel>Package to configure</InputLabel>
                <PackageSelector />
            </FormControl>
            {content}

        </React.Fragment>;
    }}
    </WithPackage>;
};
