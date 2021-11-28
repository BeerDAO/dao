import { Client, GuildMember, Intents, Role, } from "discord.js";
import "dotenv/config";
import { accountsAgent } from "./agent";

if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn("DISCORD_BOT_TOKEN not set!");
    process.exit(1);
};

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
    ],
});

client.on("ready", async () => {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
    if (!guild) return;
    let memberRole = guild.roles.cache.find((r : Role) => {
        return r.name == "Member";
    });
    if (!memberRole) {
        memberRole = await guild.roles.create({
            name: "Member",
            color: "BLUE",
            hoist: true,
        });
    };
    const members = await guild.members.fetch();
    const accounts = await accountsAgent.ledger() as [string, bigint][];
    accounts.forEach((a) => {
        const m = members.find((m : GuildMember) => {
            return m.id == a[0];
        });
        if (m) m.roles.add(memberRole as Role);
    });
    console.log("Bot is ready.");
})

client.login(process.env.DISCORD_BOT_TOKEN);
