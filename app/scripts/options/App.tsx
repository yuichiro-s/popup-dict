import * as React from "react";

import { HashRouter as Router, Link, Route } from "react-router-dom";

import AppBar from "@material-ui/core/AppBar";
import Button, { ButtonProps } from "@material-ui/core/Button";
import Toolbar from "@material-ui/core/Toolbar";

import Settings from "./views/Settings";

interface LinkButtonProps extends ButtonProps {
    to: string;
}

const LinkButton = (props: LinkButtonProps) => (
    <Button {...props} component={Link as any} />
);

export default () => (
    <Router>
        <div className="App">
            <AppBar position="static" color="primary">
                <Toolbar variant="dense">
                    <LinkButton color="inherit" to="/settings" >Settings</LinkButton>
                    <LinkButton color="inherit" to="/word-list" >Word List</LinkButton>
                    <LinkButton color="inherit" to="/history" >History</LinkButton>
                    <LinkButton color="inherit" to="/filter" >Filter</LinkButton>
                </Toolbar>
            </AppBar>
            <Route path="/settings" component={Settings} />
        </div>
    </Router>
);
