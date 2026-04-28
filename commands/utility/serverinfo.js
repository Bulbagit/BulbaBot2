// @ts-check
/*
 * Outputs general server information
 */

import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("serverinfo")
  .setDescription("Get some general info about the server.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
export async function execute(interaction) {
  const members = interaction.guild.memberCount;
  const humans = interaction.guild.members.cache.filter((member) => !member.user.bot).size;
  const bots = members - humans;
  let roles = [];
  interaction.guild.roles.cache.forEach((role) => roles.push(role.name));
  roles = roles.join(", ").trim();
  let categories = [];
  interaction.guild.channels.cache
    .filter((channel) => channel.type === 4)
    .forEach((channel) => categories.push(channel.name));
  categories = categories.join(", ").trim();
  const owner = await interaction.guild.members.fetch(interaction.guild.ownerId);
  const response = new EmbedBuilder()
    .setColor(config.messageColors.whois)
    .setAuthor({
      name: interaction.guild.name,
      iconURL: interaction.guild.iconURL(),
    })
    .addFields([
      { name: "Owner", value: owner.user.username, inline: true },
      {
        name: "Locale",
        value: interaction.guild.preferredLocale,
        inline: true,
      },
      {
        name: "Text Channels",
        value: interaction.guild.channels.cache
          .filter((channel) => channel.type === "text")
          .size.toString(),
        inline: true,
      },
      {
        name: "Voice Channels",
        value: interaction.guild.channels.cache
          .filter((channel) => channel.type === "voice")
          .size.toString(),
        inline: true,
      },
      { name: "Members", value: members.toString(), inline: true },
      { name: "Humans", value: humans.toString(), inline: true },
      { name: "Bots", value: bots.toString(), inline: true },
      {
        name: "Amount of Roles",
        value: interaction.guild.roles.cache.size.toString(),
        inline: true,
      },
      {
        name: "Amount of Categories",
        value: interaction.guild.channels.cache
          .filter((channel) => channel.type === 4)
          .size.toString(),
        inline: true,
      },
      { name: "Roles", value: roles },
      { name: "Categories", value: categories },
    ])
    .setFooter({
      text: "ID: " + interaction.guild.id + "|Server Created • " + interaction.guild.createdAt,
    });
  return interaction.reply({ embeds: [response] });
}
