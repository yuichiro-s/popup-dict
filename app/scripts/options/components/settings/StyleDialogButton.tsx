import * as React from "react";

import { DialogActions, DialogContent, DialogTitle, Grid, TextField } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { cloneDeep } from "lodash-es";

import { IGlobalSettings, INITIAL_HIGHLIGHT_STYLE } from "../../../common/global-settings";
import { applyStyle, removeStyle } from "../../../content/style";

interface Props {
    globalSettings: IGlobalSettings;
    update: (globalSettings: IGlobalSettings) => Promise<void>;
}

interface State {
    open: boolean;
}

type KEYS = "unknown" | "marked" | "known" | "hover";

export default class extends React.Component<Props, State> {
    public state = {
        open: false,
    };

    public render() {
        const { hover, known, marked, unknown } = this.props.globalSettings.highlightStyle;
        return (
            <React.Fragment>
                <Button
                    variant="outlined"
                    onClick={this.open}>
                    Edit Highlight Styles
                </Button>
                <Dialog open={this.state.open} fullWidth={true}>
                    <DialogTitle>Edit Highlight Styles</DialogTitle>
                    <DialogContent>
                        <p>hello</p>
                        <Grid container>
                            <Grid item xs={6}>
                                <h2>Unknown</h2>
                                <TextField multiline value={unknown} onChange={this.change("unknown")}></TextField>
                                <h2>Marked</h2>
                                <TextField multiline value={marked} onChange={this.change("marked")}></TextField>
                                <h2>Known</h2>
                                <TextField multiline value={known} onChange={this.change("known")}></TextField>
                                <h2>Hover</h2>
                                <TextField multiline value={hover} onChange={this.change("hover")}></TextField>
                            </Grid>
                            <Grid item xs={6}>
                            <h2>Preview</h2>

                            </Grid>
                        </Grid>
                        <Button onClick={this.restoreDefault}>Restore Default</Button>
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

    private change = (key: KEYS) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const globalSettings = cloneDeep(this.props.globalSettings);
        globalSettings.highlightStyle[key] = event.target.value;
        this.props.update(globalSettings).then(() => {
            removeStyle();
            applyStyle();
        });
    }

    private restoreDefault = () => {
        if (confirm(`Are you sure you want to reset the style of highlights?`)) {
            const globalSettings = cloneDeep(this.props.globalSettings);
            globalSettings.highlightStyle = INITIAL_HIGHLIGHT_STYLE;
            this.props.update(globalSettings);
        }
    }
}
