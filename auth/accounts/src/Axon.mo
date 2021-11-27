module {
    public let AxonId : Text = "dslea-eiaaa-aaaae-aaa3a-cai";

    public type LedgerEntry = (Principal, Nat);

    public type Interface = actor {
        ledger : Nat -> async [LedgerEntry];
    };
};
