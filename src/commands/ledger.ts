import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";

import { getAccounts } from "../accounts";
import { canisterId } from "../accounts/index";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ledger')
        .setDescription('Lists the full ledger.'),
    async execute(i: CommandInteraction) {
        const members = await i.guild?.members.fetch();
        if (!members) return;
        const accounts = (getAccounts() as [string, bigint][]).map(([id, n]) => {
            const m = members.find((m : GuildMember) => {
                return m.id == id;
            });
            if (!m) return `${id}: ${n}`;
            return `${m.user.username}#${m.user.discriminator}: ${n}`;
        });
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Ledger`)
            .setDescription(accounts.join("\n"))
            .setTimestamp(new Date())
            .setFooter(canisterId);
        await i.reply({
            embeds: [embed],
        });
    },
};
