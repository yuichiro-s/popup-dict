import * as React from "react";

import { MenuItem, Select } from "@material-ui/core";
import Button from "@material-ui/core/Button";

import { keys } from "../../../common/objectmap";
import { IPackage, PackageID } from "../../../common/package";
import { sendCommand } from "../../../content/command";
import ImportPackageButton from "./ImportPackageButton";

interface State {
    packages: { [pkgId: string]: IPackage };
    currentPkgId: PackageID | "";
}

export default class extends React.Component<{}, State> {

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

        return (
            <React.Fragment>
                <h2>Import</h2>
                <ImportPackageButton onDone={this.onImportDone}>Import new package</ImportPackageButton>
                <Button variant="outlined">Import 英辞郎</Button>

                <h2>Manage Packages</h2>
                <p>Select package</p>
                <Select value={this.state.currentPkgId} onChange={this.handleChange}>
                    {items}
                </Select>

                <p>ID: {this.state.currentPkgId}</p>
            </React.Fragment>
        );
    }

    private setCurrentPkgId = (pkgId: PackageID) => {
        this.setState({ currentPkgId: pkgId });
    }

    private handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.setCurrentPkgId(event.target.value);
    }

    private onImportDone = async (pkg: IPackage) => {
        await this.loadPackages();
        this.setCurrentPkgId(pkg.id);
    }

    private onDeleteDone = async (pkg: IPackage) => {
        await this.loadPackages();
        this.setCurrentPkgId("");
    }

    private loadPackages = async () => {
        const packages = await sendCommand({ type: "get-packages" });
        this.setState({ packages });
        return packages;
    }
}
