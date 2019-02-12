import * as React from "react";

import Button from "@material-ui/core/Button";

import { IPackage, PackageID } from "../../../common/package";
import { sendCommand } from "../../../content/command";
import ImportPackageButton from "./ImportPackageButton";

interface State {
    packages: { [pkgId: string]: IPackage };
    currentPkgId: PackageID;
}

export default class extends React.Component<{}, State> {

    public render() {
        return (
            <React.Fragment>
                <ImportPackageButton onDone={this.onImportDone}>Import new package</ImportPackageButton>
                <Button variant="outlined">Import 英辞郎</Button>

                <h2>Customize Package</h2>
                <p>hello</p>;

            </React.Fragment>
        );
    }

    private onImportDone = async (pkg: IPackage) => {
        await this.loadPackages();
        this.setCurrentPkgId(pkg.id);
    }

    private setCurrentPkgId = (pkgId: PackageID) => {
        this.setState({ currentPkgId: pkgId });
    }

    private loadPackages = async () => {
        const packages = await sendCommand({ type: "get-packages" });
        this.setState({ packages });
    }
}
