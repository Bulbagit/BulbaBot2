// @ts-check
/*
 * Unmute a user.
 */

import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";
import { Mutes, ModLogs } from "../../includes/database/index.js";
import sequelize from "../../includes/database/database.js";

export const data = new SlashCommandBuilder()
  .setName("unmute")
  .setDescription("Manually remove a mute from a user.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((user) => user.setName("user").setDescription("The muted user.").setRequired(true))
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for removing the mute.").setRequired(true)
  );
export async function execute(interaction) {
  const logsChannel = await interaction.guild.channels.fetch(config.logChannel);
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");

  const member = await interaction.guild.members.fetch(user);
  if (!member.roles.cache.has(config.muteID))
    return interaction.reply({
      content: "This user is not currently muted.",
      flags: MessageFlags.Ephemeral,
    });
  member.roles
    .remove(config.muteID)
    .then(async () => {
      await sequelize
        .transaction(() => {
          return ModLogs.create({
            loggedID: user.id,
            loggerID: interaction.user.id,
            logName: "unmute",
            message: reason,
          });
        })
        .catch((err) => console.log(err));

      await Mutes.destroy({ where: { mutedID: user.id } })
        .then(() => {
          const response = new EmbedBuilder()
            .setColor(config.messageColors.memUnmute)
            .setTitle("User unmuted")
            .setDescription(
              `User ${user.username} was manually unmuted by ${interaction.user.username}.`
            )
            .addFields([{ name: "Reason", value: reason }]) // NEW: Added to Embed
            .setTimestamp();

          logsChannel.send({ embeds: [response] });
          return interaction.reply({ embeds: [response] });
        })
        .catch((err) => {
          console.log(err);
          const response = new EmbedBuilder()
            .setColor(config.messageColors.memUnmute)
            .setTitle("User unmuted")
            .setDescription(
              `User ${user.username} was manually unmuted by ${interaction.user.username}.`
            )
            .addFields([{ name: "Reason", value: reason }])
            .setTimestamp();

          interaction.reply({
            // Changed from channel.send to reply
            content: `The "muted" role has been removed, but there was a problem removing the mute from the database. Please inform the bot's administrator.`,
            embeds: [response],
            flags: MessageFlags.Ephemeral,
          });
        });

      user
        .send({
          // NEW: Included the reason in the direct message
          content: `You have been manually unmuted in ${interaction.guild.name} by a moderator.\nReason: ${reason}`,
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
      return interaction.reply({
        content:
          "There was an error removing the muted role. Please inform the bot's administrator.",
        flags: MessageFlags.Ephemeral,
      });
    });
}
