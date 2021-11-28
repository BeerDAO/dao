import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(i : CommandInteraction) {
		await i.reply('Pong!');
	},
};
