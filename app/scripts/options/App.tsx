import * as React from "react";

import { HashRouter as Router, NavLink, Route } from "react-router-dom";

import AppBar from "@material-ui/core/AppBar";
import Button, { ButtonProps } from "@material-ui/core/Button";
import Toolbar from "@material-ui/core/Toolbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Filter from "./views/Filter";
import Settings from "./views/Settings";
import WordList from "./views/WordList";

interface LinkButtonProps extends ButtonProps {
    to: string;
}

const LinkButton = (props: LinkButtonProps) => (
    <Button {...props} component={NavLink as any} />
);

export default () => (
    <Router>
        <div className="App">
            <AppBar position="static" color="primary">
                <Toolbar variant="dense">
                    <LinkButton color="inherit" to="/settings" >Settings</LinkButton>
                    <LinkButton color="inherit" to="/word-list" >Word List</LinkButton>
                    <LinkButton color="inherit" to="/filter" >Filter</LinkButton>
                </Toolbar>
            </AppBar>
            <Route path="/settings" component={Settings} />
            <Route path="/word-list" component={WordList} />
            <Route path="/filter" component={Filter} />
            <ToastContainer className="toast-container" toastClassName="dark-toast"/>
        </div>
    </Router>
);
