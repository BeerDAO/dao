import { Client, Collection, CommandInteraction, Intents, Role, } from "discord.js";
import { readdirSync } from "fs";

import config from "./config";

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
    ],
});

client.on("ready", async () => {
    const guild = client.guilds.cache.get(config.GUILD_ID);
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
    }
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
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    { execute: (args: CommandInteraction) => Promise<any> }
>();
for (const cmd of rawCommands) {
    const name = cmd.data.name;
    commands.set(name, cmd);
}

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
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
