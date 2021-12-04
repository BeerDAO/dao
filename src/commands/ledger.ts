import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getAccounts } from "../accounts";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ledger')
        .setDescription('Lists the full ledger.'),
    async execute(i: CommandInteraction) {
        const members = await i.guild?.members.fetch();
        const accounts = getAccounts() as [string, bigint][];
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Ledger`)
            .setDescription(accounts.map(([id, n]) => {
                if (!members) return `${id}: ${n}`;
                const m = members.find((m : GuildMember) => {
                    return m.id == id;
                });
                if (!m) return `${id}: ${n}`;
                return `${m.user.username}#${m.user.discriminator}: ${n}`;
            }).join("\n"));
        await i.reply({
            embeds: [embed],
        });
    },
};
