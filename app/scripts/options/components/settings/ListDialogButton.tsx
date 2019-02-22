import * as React from "react";

import { DialogActions, DialogContent, DialogTitle, Fab, IconButton, TextField } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import { cloneDeep } from "lodash-es";

import { IGlobalSettings } from "../../../common/global-settings";

interface Props {
    title: string;
    message: JSX.Element;
    buttonTitle: string;
    globalSettings: IGlobalSettings;
    listKey: "blacklistedLanguages" | "blacklistedURLPatterns";
    update: (globalSettings: IGlobalSettings) => Promise<void>;
}

interface State {
    open: boolean;
}

export default class extends React.Component<Props, State> {
    public state = {
        open: false,
    };

    public render() {
        const content = [];
        for (const [idx, item] of this.props.globalSettings[this.props.listKey].entries()) {
            const textField = <div key={idx}>
                <TextField style={{ width: "80%" }} value={item} onChange={this.change(idx)} />
                <IconButton onClick={this.delete(idx)}><DeleteIcon /></IconButton>
            </div>;
            content.push(textField);
        }

        return (
            <React.Fragment>
                <Button
                    variant="outlined"
                    onClick={this.open}>
                    {this.props.buttonTitle}
                </Button>
                <Dialog open={this.state.open}>
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>
                        {this.props.message}
                        <Button variant="outlined" onClick={this.add}>Add</Button>
                        {content}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.close}>Close</Button>
                    </DialogActions>
                </Dialog>
            </React.Fragment>
        );
    }

    private open = () => {
        this.setState({ open: true });
    }

    private close = () => {
        this.setState({ open: false });
    }

    private add = () => {
        const globalSettings = cloneDeep(this.props.globalSettings);
        globalSettings[this.props.listKey].push("");
        this.props.update(globalSettings);
    }

    private change = (idx: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const globalSettings = cloneDeep(this.props.globalSettings);
        globalSettings[this.props.listKey][idx] = event.target.value;
        this.props.update(globalSettings);
    }

    private delete = (idx: number) => () => {
        const globalSettings = cloneDeep(this.props.globalSettings);
        globalSettings[this.props.listKey].splice(idx, 1);
        this.props.update(globalSettings);
    }

}
