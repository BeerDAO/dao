import { Principal } from "@dfinity/principal";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const stringify = (data: any) => {
    return JSON.stringify(
        data,
        (k, v) => {
            if (typeof v === "bigint") return v.toString();
            if (v instanceof Principal) return v.toText();
            if (Buffer.isBuffer(v)) return v.toString("hex");
            return v;
        },
    );
};
