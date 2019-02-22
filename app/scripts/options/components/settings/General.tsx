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
            <p>
                <ListDialogButton
                    title="Edit URL Blacklist"
                    message={<p>Highlights will be disabled on pages where the URL
                        contains one of the following patterns. You can specify
                        patterns as regular expressions. Example: <i>https://www.google.com/</i></p>}
                    buttonTitle="Edit URL Blacklist"
                    listKey="blacklistedURLPatterns"
                    globalSettings={this.state.globalSettings}
                    update={this.update}
                />
            </p>
            <p>
                <ListDialogButton
                    title="Edit Language Blacklist"
                    message={<p>Highlights will be disabled on pages where one of the
                        following languages is detected. Languages are specified as ISO-639-3 codes.
                        Supported languages are listed&nbsp;
                        <a href="https://github.com/wooorm/franc/tree/master/packages/franc">here</a>.</p>}
                    buttonTitle="Edit Language Blacklist"
                    listKey="blacklistedLanguages"
                    globalSettings={this.state.globalSettings}
                    update={this.update}
                />
            </p>
        </div >;
    }

    private update = (globalSettings: IGlobalSettings) => {
        this.setState({ globalSettings });
        return sendCommand({ type: "set-global-settings", globalSettings });
    }
}
