import "dotenv/config";

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { readdirSync } from "fs";

const commands = [];
const commandFiles = readdirSync(`${__dirname}/../commands`).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
	/* eslint-disable-next-line @typescript-eslint/no-var-requires */
	const command = require(`${__dirname}/../commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_BOT_TOKEN!);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(
				process.env.DISCORD_CLIENT_ID!,
				process.env.DISCORD_GUILD_ID!,
			),
			{ body: commands },
		);

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
})();
