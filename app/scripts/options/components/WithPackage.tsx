import * as React from "react";

import { MenuItem, Select } from "@material-ui/core";
import { cloneDeep, debounce } from "lodash-es";

import { get, keys } from "../../common/objectmap";
import { IPackage, PackageID } from "../../common/package";
import { sendCommand } from "../../content/command";

interface State {
    packages: { [pkgId: string]: IPackage };
    currentPkgId: PackageID | "";
}

interface ChildProps {
    packageSelector: () => JSX.Element | null;
    currentPkg: IPackage | null;
    updatePackage: (newPkg: IPackage) => void;
    reloadPackagesAndSetCurrentPkgId: (pkgId: PackageID) => Promise<void>;
}

interface Props {
    children: (props: ChildProps) => JSX.Element;
}

export default class WithPackage extends React.Component<Props, State> {

    public state: State = {
        currentPkgId: "",
        packages: {},
    };

    private sendUpdatePackage = debounce((pkg) => {
        sendCommand({ type: "update-package", pkg }).then(() => {
            console.log(`Updated package: ${pkg.id}`);
        });
    }, 300);

    constructor(props: Props) {
        super(props);
        this.loadPackages().then((packages) => {
            const pkgIds = keys(packages);
            if (pkgIds.length > 0) {
                const pkgId = pkgIds[0];
                this.setCurrentPkgId(pkgId);
            }
        });
    }

    public render() {
        const items: JSX.Element[] = [];
        for (const pkgId of keys(this.state.packages)) {
            const pkg = get(this.state.packages, pkgId)!;
            items.push(<MenuItem value={pkgId} key={pkgId}>{pkg.name}</MenuItem>);
        }

        const packageSelector = () => <Select
            value={this.state.currentPkgId}
            onChange={((e) => { this.setCurrentPkgId(e.target.value); })}
        >
            {items}
        </Select>;

        let currentPkg;
        if (this.state.currentPkgId === "") {
            currentPkg = null;
        } else {
            currentPkg = get(this.state.packages, this.state.currentPkgId)!;
        }

        return this.props.children({
            packageSelector,
            currentPkg,
            updatePackage: this.updatePackage,
            reloadPackagesAndSetCurrentPkgId: this.reloadPackagesAndSetCurrentPkgId,
        });
    }

    private reloadPackagesAndSetCurrentPkgId = async (pkgId: PackageID) => {
        await this.loadPackages();
        this.setCurrentPkgId(pkgId);
    }

    private updatePackage = (newPkg: IPackage) => {
        const newPackages = cloneDeep(this.state.packages);
        const pkgId = newPkg.id;
        newPackages[pkgId] = newPkg;
        this.setState({ packages: newPackages });
        this.sendUpdatePackage(newPkg);
    }

    private setCurrentPkgId = (pkgId: PackageID) => {
        this.setState({ currentPkgId: pkgId });
    }

    private loadPackages = async () => {
        const packages = await sendCommand({ type: "get-packages" });
        this.setState({ packages });
        return packages;
    }

}
