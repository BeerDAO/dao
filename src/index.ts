import { Client, Intents, } from "discord.js";
import "dotenv/config";

if (!process.env.TOKEN) {
    console.warn("TOKEN not set!");
    process.exit(1);
};

const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
});

client.login(process.env.TOKEN);
