import * as React from "react";

import { sendCommand } from "../../../content/command";

import Button from "@material-ui/core/Button";

function sendExportCommand() {
    sendCommand({ type: "export-user-data" }).then((url) => {
        const e = document.createEvent("MouseEvents");
        const a = document.createElement("a");
        a.download = "highlighter_backup.json";
        a.href = url;
        a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
        e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    });
}

export default class extends React.Component {
    public render() {
        return (<div>
            <Button variant="outlined" onClick={this.export}>Export</Button>
            <Button variant="outlined" onClick={this.export}>Import</Button>
        </div>);
    }
    private export = () => {
        sendExportCommand();
    }
}
