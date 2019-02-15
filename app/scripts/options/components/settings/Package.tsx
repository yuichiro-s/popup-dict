import * as React from "react";

import { MenuItem, Select } from "@material-ui/core";
import { cloneDeep, debounce } from "lodash-es";

import { get, keys } from "../../../common/objectmap";
import { IPackage, PackageID, ShowDictionary } from "../../../common/package";
import { sendCommand } from "../../../content/command";
import DeletePackageButton from "./DeletePackageButton";
import ImportEijiroButton from "./ImportEijiroButton";
import ImportPackageButton from "./ImportPackageButton";

interface State {
    packages: { [pkgId: string]: IPackage };
    currentPkgId: PackageID | "";
}

export default class extends React.Component<{}, State> {

    private updatePackage = debounce((pkg) => {
        sendCommand({ type: "update-package", pkg }).then(() => {
            console.log(`Updated package: ${pkg.id}`);
        });
    }, 300);

    constructor(props: {}) {
        super(props);
        this.state = {
            currentPkgId: "",
            packages: {},
        };
        this.loadPackages().then((packages) => {
            const pkgIds = keys(packages);
            if (pkgIds.length > 0) {
                const pkgId = pkgIds[0];
                this.setCurrentPkgId(pkgId);
            }
        });
    }

    public render() {
        const items = [];
        for (const pkgId of keys(this.state.packages)) {
            const pkg = this.state.packages[pkgId];
            items.push(<MenuItem value={pkgId} key={pkgId}>{pkg.name}</MenuItem>);
        }
        const currentPkg = this.state.currentPkgId ? get(this.state.packages, this.state.currentPkgId)! : null;
        const showDictionaryItems = [
            { text: "Always", value: "always" },
            { text: "Unknown or Marked", value: "unknown-or-marked" },
            { text: "Never", value: "never" },
        ].map(({ text, value }) => <MenuItem value={value} key={text}>{text}</MenuItem>);

        return (
            <React.Fragment>
                <ImportPackageButton onDone={this.onImportDone} />
                <ImportEijiroButton onDone={this.onImportDone} />

                <h2>Manage Packages</h2>
                <p>Select package</p>
                <Select value={this.state.currentPkgId} onChange={this.handleChange}>
                    {items}
                </Select>

                {currentPkg && <div>
                    <p>ID: {currentPkg.id}</p>
                    <p>When to show the dictionary tooltip</p>
                    <Select value={currentPkg.showDictionary} onChange={this.handleShowDictionaryChange}>
                        {showDictionaryItems}
                    </Select>
                    <DeletePackageButton pkg={currentPkg} onDone={this.onDeleteDone} />
                </div>}

            </React.Fragment>
        );
    }

    private setCurrentPkgId = (pkgId: PackageID) => {
        this.setState({ currentPkgId: pkgId });
    }

    private handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.setCurrentPkgId(event.target.value);
    }
    private handleShowDictionaryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPackages = cloneDeep(this.state.packages);
        const pkg = newPackages[this.state.currentPkgId];
        pkg.showDictionary = event.target.value as ShowDictionary;
        this.updatePackage(pkg);
        this.setState({packages: newPackages});
    }

    private onImportDone = async (pkg: IPackage) => {
        await this.loadPackages();
        this.setCurrentPkgId(pkg.id);
    }

    private onDeleteDone = async () => {
        await this.loadPackages();
        this.setCurrentPkgId("");
    }

    private loadPackages = async () => {
        const packages = await sendCommand({ type: "get-packages" });
        this.setState({ packages });
        return packages;
    }
}
