import * as React from "react";

import { DialogActions, DialogContent, DialogTitle, LinearProgress } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { fromEvent } from "file-selector";
import Dropzone, { DropFilesEventHandler } from "react-dropzone";
import { toast } from "react-toastify";

import { IProgress } from "../../../common/importer";
import { IPackage } from "../../../common/package";
import { importPackageFromFiles, validatePackage } from "../../importer";
import styled from "../../styled-components";
import { preventUnload } from "./prevent-unload";

import * as promiseFinally from "promise.prototype.finally";
promiseFinally.shim();

interface Props {
    onDone?: (pkg: IPackage) => void;
}

interface State {
    open: boolean;
    importing: boolean;
    progress: number;
    message: string;
    files: File[];
}

const INITIAL_STATE = {
    open: false,
    importing: false,
    progress: 0,
    message: "",
    files: [],
};

const getColor = (props: any) => {
    if (props.isDragReject) {
        return "#c66";
    }
    if (props.isDragActive) {
        return "#6c6";
    }
    return "#666";
};

const Container = styled.div`
    width: 400px;
    height: 200px;
    border-width: 2px;
    border-radius: 5px;
    border-color: ${(props) => getColor(props)};
    border-style: dashed;
  `;

export default class extends React.Component<Props, State> {
    public state = INITIAL_STATE;

    public render() {
        const importable = this.state.files.length > 0;

        let uploadMessage: JSX.Element;
        if (importable) {
            const names = [];
            for (let i = 0; i < this.state.files.length; i++) {
                const file = this.state.files[i] as File;
                names.push(<li key={i}>{file.name}</li>);
            }
            uploadMessage = <div>
                <p>Ready to upload the following files:</p>
                <ul>{names}</ul>
            </div>;
        } else {
            uploadMessage = <p>Upload a package directory here</p>;
        }

        let content;
        if (this.state.importing) {
            content = (<React.Fragment>
                <LinearProgress variant="determinate" value={this.state.progress} />
                <p>{this.state.message}</p>
            </React.Fragment>);
        } else {
            content = (
                <Dropzone
                    onDrop={this.onDrop}
                    getDataTransferItems={(e: Event) => fromEvent(e)}
                    multiple
                >
                    {({ getRootProps, getInputProps }) => (
                        <Container {...getRootProps()}>
                            <input {...getInputProps({ webkitdirectory: "webkitdirectory" })} />
                            {uploadMessage}
                        </Container>
                    )}
                </Dropzone>
            );
        }

        return (
            <React.Fragment>
                <Button
                    variant="outlined"
                    onClick={this.onOpen}>
                    Import Package
                </Button>
                <Dialog
                    open={this.state.open}
                    disableBackdropClick
                    disableEscapeKeyDown>
                    <DialogTitle>Import package</DialogTitle>
                    <DialogContent>
                        {content}
                    </DialogContent>
                    {!this.state.importing && <DialogActions>
                        <Button onClick={this.cancel}>Cancel</Button>
                        <Button
                            onClick={this.startImport}
                            disabled={!importable}
                            color="primary"
                        >Import</Button>
                    </DialogActions>}
                </Dialog>
            </React.Fragment>
        );
    }

    private startImport = () => {
        preventUnload(true);
        this.setState({ importing: true, message: "Import started" });
        importPackageFromFiles(this.state.files, (progress: IProgress) => {
            const p = Math.round(progress.ratio * 100);
            this.setState({
                progress: p,
                message: `[${p}%] ${progress.msg}`,
            });
        }).then((pkg: IPackage) => {
            toast.success(`Successfully imported ${pkg.name}.`);
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
        this.setState(INITIAL_STATE);
        this.setState({ open: true });
    }

    private cancel = () => {
        this.setState({ open: false });
    }

    private onDrop: DropFilesEventHandler = (files) => {
        const { errors, warnings } = validatePackage(files);
        if (errors.length === 0 && warnings.length === 0) {
            this.setState({ files });
        } else {
            for (const msg of errors.concat(warnings)) {
                toast.error(msg);
            }
        }
    }
}
