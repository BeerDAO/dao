import Array "mo:base/Array";
import Blob "mo:base/Blob";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Random "mo:base/Random";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

shared({caller = owner}) actor class Accounts() {
    public type DiscordId = Text;
    public type DiscordAccount = {
        id            : DiscordId;
        userName      : Text;
        discriminator : Text;
    };

    private type Account = {
        userName      : Text;
        discriminator : Text;
        principal     : Principal;
    };

    private stable var stableAccounts : [(DiscordId, Account)] = [];

    // All known accounts.
    private let accounts = HashMap.fromIter<DiscordId, Account>(
        stableAccounts.vals(), 10, Text.equal, Text.hash,
    );

    system func preupgrade() {
        stableAccounts := Iter.toArray(accounts.entries());
    };

    system func postupgrade() {
        stableAccounts := [];
    };

    public query func discordNames() : async [Text] {
        let as = Array.init<Text>(accounts.size(), "");
        var i = 0;
        for ((_, a) in accounts.entries()) {
            as[i] := a.userName # "#" # a.discriminator;
            i += 1;
        };
        Array.freeze(as);
    };

    // A map of link requests added by the backend.
    // id -> (account, ttl)
    private let discordLinkRequests = HashMap.HashMap<Blob, (DiscordAccount, Int)>(
        10, Blob.equal, Blob.hash,
    );

    private let hour = 3600000000000; // In nanoseconds.

    public shared({caller}) func addDiscordAccount(account : DiscordAccount) : async Blob {
        assert (caller == owner);

        let now = Time.now();
        let key = await Random.blob();
        discordLinkRequests.put(key, (account, now));

        // Remove old link requests.
        for ((k, (a, ttl)) in discordLinkRequests.entries()) {
            if (now + hour < ttl) discordLinkRequests.delete(k);
        };
        
        // Return the key linked to the request, this is needed to link the principal.
        key;
    };

    public shared({caller}) func linkPrincipal(key : Blob) : async Result.Result<(), Text> {
        switch (discordLinkRequests.get(key)) {
            case (null) #err("the key is invalid or has expired and was deleted");
            case (? (a, ttl)) {
                let now = Time.now();
                if (now + hour < ttl) {
                    discordLinkRequests.delete(key);
                    return #err("key has expired");  
                };
                accounts.put(a.id, {
                    userName      = a.userName;
                    discriminator = a.discriminator;
                    principal     = caller;
                });
                #ok();
            };
        };
    };
};
