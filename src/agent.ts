import { HttpAgent } from "@dfinity/agent";
import * as accounts from "./accounts/index";

import fetch from 'node-fetch';
(global as any).fetch = fetch;

export const agent = new HttpAgent({
    host: "https://ic0.app",
});

export const accountsAgent = accounts.createActor(agent);
