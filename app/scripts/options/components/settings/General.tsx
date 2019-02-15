import * as React from "react";

import { IGlobalSettings, INITIAL_GLOBAL_SETTINGS } from "../../../common/global-settings";
import { sendCommand } from "../../../content/command";
import ListDialogButton from "./ListDialogButton";

interface State {
    globalSettings: IGlobalSettings;
}

export default class extends React.Component<{}, {}> {
    public state: State = {
        globalSettings: INITIAL_GLOBAL_SETTINGS,
    };

    constructor(props: {}) {
        super(props);
        sendCommand({ type: "get-global-settings" }).then((globalSettings) => {
            this.setState({ globalSettings });
        });
    }

    public render() {
        return <div>
            <ListDialogButton
                title="Edit URL Blacklist"
                buttonTitle="Edit URL Blacklist"
                listKey="blacklistedURLPatterns"
                globalSettings={this.state.globalSettings}
                update={this.update}
            />

            <ListDialogButton
                title="Edit Language Blacklist"
                buttonTitle="Edit Language Blacklist"
                listKey="blacklistedLanguages"
                globalSettings={this.state.globalSettings}
                update={this.update}
            />
        </div>;
    }

    private update = (globalSettings: IGlobalSettings) => {
        this.setState({ globalSettings });
        sendCommand({ type: "set-global-settings", globalSettings });
    }
}
