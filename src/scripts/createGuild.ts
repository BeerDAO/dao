import { Client, Intents, TextChannel, } from "discord.js";
import "dotenv/config";

if (!process.env.TOKEN) {
    console.warn("TOKEN not set!");
    process.exit(1);
};

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

client.on("ready", () => {
    console.log("Ready!");
    client.guilds.create("BeerDAO", {
        channels: [{
            name: "invite-channel",
            type: "GUILD_TEXT",
        }]
    }).then(guild => {
        const channel = guild.channels.cache.find(c => c.name === "invite-channel") as TextChannel;
        if (!channel) return;
        channel.createInvite({
            maxAge: 0,
            maxUses: 1,
        }).then(i => console.log(guild.name, i.url));
    });
});

client.login(process.env.TOKEN);
