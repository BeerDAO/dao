import { Principal } from "@dfinity/principal";

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
