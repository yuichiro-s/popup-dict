import * as React from "react";

import { DialogActions, DialogContent, DialogTitle, LinearProgress } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { cloneDeep } from "lodash-es";
import { toast } from "react-toastify";

import { IPackage } from "../../../common/package";
import { sendCommand } from "../../../content/command";
import { preventUnload } from "./prevent-unload";

import * as promiseFinally from "promise.prototype.finally";
promiseFinally.shim();

interface Props {
    pkg: IPackage;
    onDone?: (pkg: IPackage) => void;
}

interface State {
    open: boolean;
    deleting: boolean;
}

const INITIAL_STATE = {
    open: false,
    deleting: false,
};

export default class extends React.Component<Props, State> {
    public state = INITIAL_STATE;

    public render() {
        const pkg = this.props.pkg;

        let content;
        if (this.state.deleting) {
            content = <div style={{ width: 400 }}>
                <LinearProgress variant="indeterminate" />
                <p>Deleting {pkg.name} ...</p>
            </div>;
        } else {
            content = <p>Are you sure you want to delete {pkg.name}? This cannot be undone.</p>;
        }

        return (
            <React.Fragment>
                <Button
                    variant="outlined"
                    onClick={this.onOpen}>
                    Delete Package
                </Button>
                <Dialog
                    open={this.state.open}
                    disableBackdropClick
                    disableEscapeKeyDown>
                    <DialogTitle>Delete package</DialogTitle>
                    <DialogContent>
                        {content}
                    </DialogContent>
                    {!this.state.deleting && <DialogActions>
                        <Button onClick={this.cancel}>Cancel</Button>
                        <Button onClick={this.startDelete}>Delete</Button>
                    </DialogActions>}
                </Dialog>
            </React.Fragment>
        );
    }

    private startDelete = () => {
        preventUnload(true);
        const pkg = this.props.pkg;
        this.setState({ deleting: true });
        sendCommand({
            type: "delete-package",
            pkgId: pkg.id,
        }).then(() => {
            toast.success(`${pkg.name} has been successfully deleted.`);
            if (this.props.onDone) {
                this.props.onDone(pkg);
            }
        }).catch((err: Error) => {
            toast.error(err.message);
        }).finally(() => {
            preventUnload(false);
            this.cancel();
        });
    }

    private onOpen = () => {
        const newState = cloneDeep(INITIAL_STATE);
        newState.open = true;
        this.setState(newState);
    }

    private cancel = () => {
        this.setState({ open: false });
    }
}
