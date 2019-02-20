import * as React from "react";

import General from "../components/settings/General";
import Package from "../components/settings/Package";
import UserData from "../components/settings/UserData";

export default () => (<div>
    <h1>General</h1>
    <General />

    <hr />

    <h1>Package</h1>
    <Package />

    <hr />

    <h1>User Data</h1>
    <UserData />
</div>);
