// @ts-check
/**
 * Mute a user.
 */

import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import sequelize from "../../includes/database/database.js";
import config from "../../config.js";
import { ModLogs, Mutes } from "../../includes/database/index.js";
import { getDuration, canModerate } from "../../includes/utils.js";

export const data = new SlashCommandBuilder()
  .setName("mute")
  .setDescription("Prevent a user from typing in text channels for a set period of time.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  )
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for mute.").setRequired(true)
  )
  .addStringOption((duration) =>
    duration
      .setName("duration")
      .setDescription("Duration for the mute. Accepts days (d), hours (h), or minutes (m).")
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const durationStr = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason");
  const targetUser = interaction.options.getUser("user");
  const fullUser = await interaction.client.users.fetch(targetUser);
  const isInServer = await interaction.guild.members.fetch(targetUser).catch(() => null);

  if (!isInServer) {
    return interaction.editReply({
      content: "The user is not in the server, so they cannot be muted.",
    });
  }

  const member = isInServer;

  if (!canModerate(interaction.member, member)) {
    interaction.client.emit("unauthorized", interaction.client, interaction.user, {
      command: "mute",
      details: `User ${interaction.user.username} attempted to mute ${fullUser.username}, giving the reason "${reason}"`,
    });

    return interaction.editReply({
      content:
        "The bot may not be used to perform moderation actions against other moderators or higher. This incident will be logged.",
    });
  }

  if (fullUser.id === config.clientID) {
    return interaction.editReply({
      content: "I can't mute myself.",
    });
  }

  if (member.roles.cache.has(config.muteID)) {
    return interaction.editReply({
      content: "The user is already muted.",
    });
  }

  const durationParsed = getDuration(durationStr);

  if (!durationParsed) {
    return interaction.editReply({
      content:
        "Your format for the duration is not correct. You can specify days (d), hours (h), or minutes(m).",
    });
  }

  const interval = durationParsed[1];

  const muted = await Mutes.findOne({ where: { mutedID: fullUser.id } });
  if (muted) await Mutes.destroy({ where: { mutedID: fullUser.id } });
  try {
    await sequelize.transaction(async (t) => {
      await ModLogs.create(
        {
          loggedID: fullUser.id,
          loggerID: interaction.user.id,
          logName: "mute:" + durationStr,
          message: reason,
        },
        { transaction: t }
      );

      await Mutes.create(
        {
          mutedID: fullUser.id,
          mutedName: fullUser.username,
          duration: durationStr,
          unmutedTime: sequelize.literal("DATE_ADD(NOW()," + interval + ")"),
        },
        { transaction: t }
      );
    });

    await member.roles.add(config.muteID);

    const message =
      `You have been muted in ${interaction.guild.name} by a moderator for ${durationStr}. The reason provided is as follows:` +
      `\n${reason}` +
      `\nIf you believe this was done in error, you may contact the moderators to request manual review. Please be aware that harassment directed at any of the moderators may result in direct referral to Discord staff.`;

    let dmFailed = false;
    try {
      await fullUser.send({ content: message });
    } catch {
      console.log(`Failed to send mute DM to ${fullUser.username}.`);
      dmFailed = true;
    }

    const channel = await interaction.client.channels.fetch(config.logChannel);
    const response = new EmbedBuilder()
      .setColor(config.messageColors.memMute)
      .setTitle("Member muted")
      .setDescription(
        `Member <@!${fullUser.id}> (@${fullUser.username}) has been muted by <@!${interaction.user.id}> for ${durationStr}.`
      )
      .addFields([{ name: "Reason", value: reason }])
      .setTimestamp();

    if (dmFailed) {
      response.setFooter({
        text: "Note: Could not DM the user about this mute (privacy settings).",
      });
    }

    if (channel) {
      await channel.send({ embeds: [response] });
    }

    return interaction.editReply({ embeds: [response] });
  } catch (err) {
    console.error("Error executing mute command:", err);

    const channel = await interaction.guild.channels.fetch(config.logChannel).catch(() => null);
    if (channel) {
      const response = new EmbedBuilder()
        .setColor(config.messageColors.error)
        .setTitle("Error processing mute")
        .setDescription(
          `An error occurred while trying to process the mute for <@!${fullUser.id}>.`
        )
        .addFields([
          { name: "Moderator", value: `<@!${interaction.user.id}>` },
          { name: "Reason", value: reason },
          { name: "Error", value: err.message || "Check console for details." },
        ])
        .setTimestamp();

      await channel.send({ embeds: [response] });
    }

    return interaction.editReply({
      content: "Mute action failed. This may be due to a database error or missing permissions.",
    });
  }
}
