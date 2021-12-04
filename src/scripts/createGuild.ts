import "dotenv/config";

import { Client, Intents, TextChannel, } from "discord.js";

if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn("DISCORD_BOT_TOKEN not set!");
    process.exit(1);
}

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

client.on("ready", () => {
    console.log("Ready!");
    client.guilds.create("Fermented DAO", {
        channels: [{
            name: "general",
            type: "GUILD_TEXT",
        }],
    }).then(guild => {
        const channel = guild.channels.cache.find(c => c.name === "general") as TextChannel;
        if (!channel) return;
        channel.createInvite({
            maxAge: 0,
            maxUses: 4,
        }).then(i => console.log(guild.name, i.url));
    });
});

client.login(process.env.DISCORD_BOT_TOKEN);
