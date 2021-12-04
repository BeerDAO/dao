import { HttpAgent } from "@dfinity/agent";
import fetch from 'node-fetch';

import * as accounts from "./accounts/index";
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
(global as any).fetch = fetch;

export const agent = new HttpAgent({
    host: "https://ic0.app",
});

export const accountsAgent = accounts.createActor(agent);
