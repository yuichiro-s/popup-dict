import * as React from "react";

import Button from "@material-ui/core/Button";

export default class extends React.Component {
    public render() {
        return (<div>
            <Button variant="outlined" onClick={this.hello}>Export</Button>
            <Button variant="outlined" onClick={this.hello}>Import</Button>
        </div>);
    }
    private hello = () => {
        console.log("hello");
    }
}
