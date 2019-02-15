import * as React from "react";

import { DialogActions, DialogContent } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { fromEvent } from "file-selector";
import Dropzone, { DropFilesEventHandler } from "react-dropzone";
import { toast } from "react-toastify";

import { IProgress } from "../../../common/importer";
import { IPackage } from "../../../common/package";
import { importPackageFromFiles, validatePackage } from "../../importer";
import styled from "../../styled-components";
import ImportButton from "./ImportDialogButton";

import * as promiseFinally from "promise.prototype.finally";
promiseFinally.shim();

interface Props {
    onDone: (pkg: IPackage) => void;
}

interface State {
    files: File[];
}

const INITIAL_STATE = {
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

        const inner = ({ cancel, startImport }: { cancel: () => void, startImport: () => void }) =>
            <React.Fragment>
                <DialogContent>
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancel}>Cancel</Button>
                    <Button
                        onClick={startImport}
                        disabled={!importable}
                        color="primary"
                    >Import</Button>
                </DialogActions>
            </React.Fragment>;

        return <ImportButton
            onDone={this.props.onDone}
            buttonTitle="Import Package"
            title="Import Package"
            importFn={this.importFn}
            onOpen={this.onOpen}
            inner={inner} />;
    }

    private importFn = (progressFn: (progress: IProgress) => void) => {
        return importPackageFromFiles(this.state.files, progressFn);
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

    private onOpen = () => {
        this.setState({files: []});
    }
}
