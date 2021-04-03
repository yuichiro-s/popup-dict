import * as React from "react";

import { DialogActions, DialogContent, Step, StepLabel, Stepper } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { fromEvent } from "file-selector";
import { cloneDeep } from "lodash-es";
import Dropzone, { DropFilesEventHandler } from "react-dropzone";
import { toast } from "react-toastify";

import { IProgress } from "../../../common/importer";
import { IPackage } from "../../../common/package";
import { loadEijiroFromFiles } from "../../eijiro";
import styled from "styled-components";
import ImportDialogButton from "./ImportDialogButton";

import * as promiseFinally from "promise.prototype.finally";
promiseFinally.shim();

interface Props {
    onDone: (pkg: IPackage) => void;
}

interface State {
    eijiroFile: File | null;
    inflectionFile: File | null;
    frequencyFile: File | null;
    whitelistFile: File | null;
    activeStep: number;
}

const INITIAL_STATE = {
    eijiroFile: null,
    inflectionFile: null,
    frequencyFile: null,
    whitelistFile: null,
    activeStep: 0,
};

const Container = styled.div`
    width: 400px;
    height: 200px;
    border-width: 2px;
    border-radius: 5px;
    border-style: dashed;
    background-color: #eeeeee;
    text-align: center;
  `;

export default class extends React.Component<Props, State> {
    public state = INITIAL_STATE;

    public render() {
        const { activeStep, eijiroFile, inflectionFile, frequencyFile, whitelistFile } = this.state;
        const importable = eijiroFile && inflectionFile && frequencyFile && whitelistFile;
        const steps = [
            "Upload 英辞郎 file",
            "Upload auxiliary files",
            "Import",
        ];

        let content: JSX.Element | null = null;
        if (activeStep === 0) {
            content = <Dropzone onDrop={this.onDrop1}>
                {({ getRootProps, getInputProps }) => (
                    <Container {...getRootProps()}>
                        <input {...getInputProps()} />
                        <div>
                            <p>{eijiroFile ?
                                (eijiroFile as any).name :
                                "Drag and drop EIJIRO-1446.TXT here or click"}</p>
                        </div>
                    </Container>
                )}
            </Dropzone>;
        } else if (activeStep === 1) {
            content = <Dropzone
                onDrop={this.onDrop2}
                getDataTransferItems={(e: Event) => fromEvent(e)}
                multiple
            >
                {({ getRootProps, getInputProps }) => (
                    <Container {...getRootProps()}>
                        <input {...getInputProps({ webkitdirectory: "webkitdirectory" })} />
                        <div>
                            {importable ?
                                [inflectionFile, frequencyFile, whitelistFile].map(
                                    (f: any) => <p key={f.name}>{f.name}</p>)
                                : <p>Drag and drop "auxiliary" directory here or click</p>
                            }
                        </div>
                    </Container>
                )}
            </Dropzone>;
        }

        const inner = ({ cancel, startImport }: { cancel: () => void, startImport: () => void }) =>
            <React.Fragment>
                <DialogContent>
                    {content}
                </DialogContent>
                {(activeStep === 0 &&
                    <DialogActions>
                        <Button onClick={cancel}>Cancel</Button>
                        <Button onClick={this.next}
                            color="primary"
                            disabled={this.state.eijiroFile === null}>Next</Button>
                    </DialogActions>) ||
                    (activeStep === 1 &&
                        <DialogActions>
                            <Button onClick={cancel}>Cancel</Button>
                            <Button onClick={() => { this.next(); startImport(); }}
                                color="primary"
                                disabled={!importable}>Import</Button>
                        </DialogActions>
                    ) || null}
            </React.Fragment>;

        return <ImportDialogButton
            header={<Stepper activeStep={activeStep}>
                {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>}
            onDone={this.props.onDone}
            buttonTitle="Import 英辞郎"
            title="Import 英辞郎"
            importFn={this.importFn}
            onOpen={this.onOpen}
            inner={inner} />;
    }

    private importFn = (progressFn: (progress: IProgress) => void) => {
        return loadEijiroFromFiles(
            this.state.eijiroFile!,
            this.state.inflectionFile!,
            this.state.frequencyFile!,
            this.state.whitelistFile!,
            progressFn);
    }

    private next = () => {
        this.setState(({ activeStep }) => ({ activeStep: activeStep + 1 }));
    }

    private onDrop1: DropFilesEventHandler = (files) => {
        if (files.length === 1) {
            this.setState({ eijiroFile: files[0] });
        }
    }

    private onDrop2: DropFilesEventHandler = (files) => {
        const findFile = (name: string): File | null => {
            for (const file of files) {
                if (file.name === name) {
                    return file;
                }
            }
            return null;
        };
        const inflectionFile = findFile("inflection");
        const frequencyFile = findFile("frequency");
        const whitelistFile = findFile("whitelist");
        if (!inflectionFile) { toast.error('File "inflection" not found.'); }
        if (!frequencyFile) { toast.error('File "frequency" not found.'); }
        if (!whitelistFile) { toast.error('File "whitelist" not found.'); }
        if (inflectionFile && frequencyFile && whitelistFile) {
            this.setState({ inflectionFile, frequencyFile, whitelistFile });
        }
    }

    private onOpen = () => {
        const newState = cloneDeep(INITIAL_STATE);
        this.setState(newState);
    }
}
