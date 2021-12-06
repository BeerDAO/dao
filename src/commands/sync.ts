import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, GuildMemberRoleManager, MessageEmbed, Role } from "discord.js";

import { cacheAccounts } from "../accounts";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sync')
        .setDescription('Add/removes members based on the ledger.'),
    async execute(i: CommandInteraction) {
        const memberRole = i.guild?.roles.cache.find((r: Role) => {
            return r.name == "Member";
        });
        if (!memberRole) return;
        const members = await i.guild?.members.fetch();
        if (!members) return;
        if (!(i.member.roles as GuildMemberRoleManager).cache.has(memberRole.id)) return;

        await i.deferReply();
        let ledgerAccounts: [string, bigint][] = []
        try {
            const accounts = await cacheAccounts();
            ledgerAccounts = accounts as [string, bigint][];
        } catch (e) {
            console.warn(e);
            return;
        }
        const accounts = new Set(ledgerAccounts.map(([id]) => id));
        const add: GuildMember[] = [];
        const del: GuildMember[] = [];
        members.forEach((m) => {
            if (accounts.has(m.id)) {
                if (!m.roles.cache.has(memberRole.id)) {
                    // NOK, member needs to be added.
                    add.push(m);
                }
            } else {
                if (m.roles.cache.has(memberRole.id)) {
                    // NOK, ledger does not recognize this member.
                    del.push(m);
                }
            }
            accounts.delete(m.id);
        });
        if (add.length == 0 && del.length == 0) {
            await i.editReply({
                content: "There was nothing to sync...",
            });
            return;
        }
        add.forEach((m) => {
            m.roles.add(memberRole);
        })
        const addMessage = add.length == 0
            ? "No members were added."
            : `Accounts added: ${add.map((m) => `${m.user.username}#${m.user.discriminator}`).join(", ")}.`
        del.forEach((m) => {
            m.roles.remove(memberRole);
        })
        const delMessage = del.length == 0
            ? "No members were removed."
            : `Accounts removed: ${del.map((m) => `${m.user.username}#${m.user.discriminator}`).join(", ")}.`
        const embed = new MessageEmbed()
            .setTitle("Members are synced.")
            .setDescription(`${addMessage}\n${delMessage}\n`)
            .setColor("#0000ff");
        await i.followUp({
            embeds: [embed],
        });
    },
};
