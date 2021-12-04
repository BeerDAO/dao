import { Client, Collection, CommandInteraction, GuildMember, Intents, Role, } from "discord.js";
import "dotenv/config";
import { readdirSync } from "fs";
import { cacheAccounts } from "./accounts";

if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn("DISCORD_BOT_TOKEN not set!");
    process.exit(1);
};

if (!process.env.DISCORD_GUILD_ID) {
    console.warn("DISCORD_GUILD_ID not set!");
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
    console.log("Syncing accounts...");
    const accounts = await cacheAccounts();
    accounts.forEach(([id, _]) => {
        const m = members.find((m : GuildMember) => {
            return m.id == id;
        });
        if (m) m.roles.add(memberRole as Role);
    });
    console.log("Done syncing.");
    console.log("Bot is ready.");
})

// Load commands.
const rawCommands = readdirSync(
    `${__dirname}/commands`,
).filter(
    (f) => /(js|ts)$/.test(f)
).map((f) => require(`${__dirname}/commands/${f}`));

const commands = new Collection<
    string,
    { execute: (args: CommandInteraction) => Promise<any> }
>();
for (const cmd of rawCommands) {
    const name = cmd.data.name;
    commands.set(name, cmd);
};

client.on("interactionCreate", async (i) => {
    if (!i.isCommand()) return;
    const cmd = commands.get(i.commandName);
    if (!cmd) return;
    try {
        await cmd.execute(i);
    } catch (e) {
        console.error(e);
        return i.reply({
            content: "Oops, an error occured...",
            ephemeral: true,
        });
    };
});

client.login(process.env.DISCORD_BOT_TOKEN);
