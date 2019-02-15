import * as React from "react";

import { DialogContent, DialogTitle, LinearProgress } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { cloneDeep } from "lodash-es";
import { toast } from "react-toastify";

import { IProgress } from "../../../common/importer";
import { IPackage } from "../../../common/package";
import { preventUnload } from "./prevent-unload";

import * as promiseFinally from "promise.prototype.finally";
promiseFinally.shim();

interface Props {
    onDone: (pkg: IPackage) => void;
    onOpen: () => void;
    buttonTitle: string;
    title: string;
    importFn: (progressFn: (progress: IProgress) => void) => Promise<IPackage>;
    inner: (props: {
        cancel: () => void,
        startImport: () => void,
    }) => JSX.Element;
    header?: JSX.Element;
}

interface State {
    open: boolean;
    importing: boolean;
    progress: number;
    message: string;
}

const INITIAL_STATE = {
    open: false,
    importing: false,
    progress: 0,
    message: "",
};

export default class extends React.Component<Props, State> {
    public state = INITIAL_STATE;

    public render() {
        let content;
        if (this.state.importing) {
            content = <DialogContent>
                <LinearProgress variant="determinate" value={this.state.progress} />
                <p>{this.state.message}</p>
            </DialogContent>;
        } else {
            content = this.props.inner({
                cancel: this.cancel,
                startImport: this.startImport,
            });
        }

        return (
            <React.Fragment>
                <Button
                    variant="outlined"
                    onClick={this.onOpen}>
                    {this.props.buttonTitle}
                </Button>
                <Dialog
                    open={this.state.open}
                    disableBackdropClick
                    disableEscapeKeyDown>
                    <DialogTitle>{this.props.title}</DialogTitle>
                    {this.props.header}
                    {content}
                </Dialog>
            </React.Fragment>
        );
    }

    private startImport = () => {
        preventUnload(true);
        this.setState({ importing: true, message: "Import started" });
        this.props.importFn((progress: IProgress) => {
            const p = Math.round(progress.ratio * 100);
            this.setState({
                progress: p,
                message: `[${p}%] ${progress.msg}`,
            });
        }).then((pkg: IPackage) => {
            toast.success(`Successfully imported ${pkg.name}.`);
            this.props.onDone(pkg);
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
        this.props.onOpen();
    }

    private cancel = () => {
        this.setState({ open: false });
    }
}
