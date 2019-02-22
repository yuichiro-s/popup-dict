import * as React from "react";
import { toast } from "react-toastify";

import { sendCommand } from "../../../content/command";

import Button from "@material-ui/core/Button";
import { UploadFiles } from "./util";

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

function sendImportCommand(file: File) {
    const url = URL.createObjectURL(file);
    sendCommand({ type: "import-user-data", dataURL: url })
        .then((msg) => {
            toast.success(msg);
        })
        .catch((err) => {
            toast.error(err);
        });
}

export default class extends React.Component {

    public render() {
        return (
            <div>
                <p>
                    <Button variant="outlined" onClick={this.export}>Export User Data</Button>
                </p>
                <p>
                    <Button variant="outlined" onClick={this.import}>Import User Data</Button>
                </p>
            </div>
        );
    }
    private export = () => {
        sendExportCommand();
    }
    private import = async () => {
        const files = await UploadFiles();
        if (files.length === 1) {
            const file = files[0];
            sendImportCommand(file);
        }
    }
}
