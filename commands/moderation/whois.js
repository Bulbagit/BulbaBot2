// @ts-check
/*
 * Gather all information about a user.
 */

import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("whois")
  .setDescription("Displays information about a user account.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((user) =>
    user.setName("user").setDescription("User to inspect.").setRequired(true)
  );
export async function execute(interaction) {
  let user = interaction.options.getUser("user");

  const member = await interaction.guild.members.fetch(user).catch((err) => {
    console.log(err);
  });

  let rolesField = { name: "Roles", value: "Not in server", inline: false };

  if (member) {
    rolesField.value =
      member.roles.cache.size > 1
        ? member.roles.cache
            .filter((role) => role.name !== "@everyone")
            .map((role) => role.name)
            .join(", ")
        : "None";
  }
  const response = new EmbedBuilder()
    .setColor(config.messageColors.whois)
    .setTitle(`Whois information for ${user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .addFields([
      { name: "ID", value: user.id, inline: true },
      {
        name: "Nickname",
        value: member && member.nickname ? member.nickname : "None set or not in server",
        inline: true,
      },
      {
        name: "Joined",
        value: member ? member.joinedAt.toString() : "Not in server",
        inline: true,
      },
      { name: "Registered", value: user.createdAt.toString(), inline: true },
      rolesField,
    ])
    .setTimestamp();
  return interaction.reply({ embeds: [response] });
}
