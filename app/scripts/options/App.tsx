import * as React from "react";

import { HashRouter as Router, Link, Route } from "react-router-dom";

import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Toolbar from "@material-ui/core/Toolbar";

import Settings from "./views/Settings";

class App extends React.Component {
    public render() {
        return (
            <Router>
                <div className="App">
                    <AppBar position="static" color="primary">
                        <Toolbar variant="dense">
                            <Link to="settings"><Button>Settings</Button></Link>
                            <Link to="wordlist"><Button>Word List</Button></Link>
                            <Link to="history"><Button>History</Button></Link>
                            <Link to="filter"><Button>Filter</Button></Link>
                        </Toolbar>
                    </AppBar>
                    <Route path="settings" component={Settings} />
                </div>
            </Router>
        );
    }
}

export default App;
