
   
import { readFileSync, writeFileSync } from "fs";

import { accountsAgent } from "./agent";
import { stringify } from "./stringify";

const PATH = `${__dirname}/../cache/accounts.json`;

export async function cacheAccounts() : Promise<[string, bigint][]> {
    try {
        const txs = await accountsAgent.ledger() as [string, bigint][];
        writeFileSync(PATH, stringify(txs));
        return txs;
    } catch (e) {
        console.warn(e);
        return [];
    }
}

export const getAccounts = () => {
    try {
        const l = JSON.parse(readFileSync(PATH).toString());
        return l;
    } catch (e) {
        console.warn(e);
        return [];
    }
};