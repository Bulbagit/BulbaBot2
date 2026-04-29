// @ts-check
/*
 * Mute a user.
 */

import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import sequelize from "../../includes/database/database.js";
import config from "../../config.js";
import { ModLogs, Mutes } from "../../includes/database/index.js";
import { literal } from "sequelize";
import { canModerate, getDuration } from "../../includes/utils.js";

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
  const logsChannel = await interaction.guild.channels.fetch(config.logChannel);
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  const member = await interaction.guild.members.fetch(user).catch((err) => console.log(err));
  if (!canModerate(interaction.member, member)) {
    interaction.client.emit("unauthorized", interaction.client, interaction.user, {
      command: "mute",
      details: `${interaction.user.username} attempted to mute user #${user.username} with reason ${reason}`,
    });
    return interaction.reply({
      content:
        "You do not have permission to moderate this user because their role is equal to or higher than yours. This incident has been logged.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (member.roles.cache.has(config.muteID))
    return interaction.reply({
      content: `This user is already muted. (User: ${member.user.username})`,
      flags: MessageFlags.Ephemeral,
    });
  if (member.roles.cache.has(config.muteID))
    return interaction.reply({
      content: `This user is already muted. (User: ${member.user.username})`,
      flags: MessageFlags.Ephemeral,
    });
  // Parse user input
  const userDuration = interaction.options.getString("duration");
  let duration = getDuration(userDuration);
  if (!duration)
    return interaction.reply({
      content:
        "Your format for the duration is not correct. You can specify days (d), hours (h), or minutes(m).",
      flags: MessageFlags.Ephemeral,
    });
  const interval = duration[1];
  duration = duration[0];

  const muted = await Mutes.findOne({ where: { mutedID: user.id } });
  // User doesn't have the muted role, but there's a mute in the database already. Delete it to make room for the new one.
  if (muted) await Mutes.destroy({ where: { mutedID: user.id } });

  await member.roles.add(config.muteID, reason).catch((err) => {
    console.log(err);
    return interaction.reply({
      content:
        "There was an error while attempting the mute. Please inform the bot's administrator.",
    });
  });

  // Stage the unmute
  setTimeout(() => {
    interaction.client.emit("unmute", interaction.client, user.id, false);
  }, duration);

  return sequelize
    .transaction(() => {
      return ModLogs.create({
        loggedID: user.id,
        loggerID: interaction.user.id,
        logName: "mute:" + userDuration,
        message: reason,
      })
        .then(() => {
          return Mutes.create({
            mutedID: user.id,
            mutedName: user.username,
            duration: userDuration,
            unmutedTime: literal("DATE_ADD(NOW()," + interval + ")"),
          }).catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    })
    .then(() => {
      // Transaction was successfully committed. Everything is A-OK.
      user
        .send({
          content:
            `You have been muted by a moderator in ${interaction.guild.name} for ${userDuration}.` +
            ` The reason for your mute is as follows:\n${reason}\nYour mute will expire automatically after the duration has ended.` +
            ` Please take this time to review the server rules to prevent further action against your account. Harassment of any kind toward` +
            ` moderators may result in referral to Discord staff.\nIf your mute is not automatically lifted after the expiration, you` +
            ` may message a moderator and request it to be manually removed.`,
        })
        .catch((err) => {
          console.log(err);
          const response = new EmbedBuilder()
            .setColor(config.messageColors.error)
            .setTitle("Message Failed")
            .setDescription(
              `Sending mute message to user @${user.username} failed. This is likely a result of their privacy settings.`
            )
            .setTimestamp();
          logsChannel.send({ embeds: [response] });
        });
      const response = new EmbedBuilder()
        .setColor(config.messageColors.memMute)
        .setTitle("User Muted")
        .setDescription(`User ${user.username} has been muted for ${userDuration}.`)
        .setTimestamp();
      logsChannel.send({ embeds: [response] });
      return interaction.reply({ embeds: [response] });
    })
    .catch((err) => {
      console.log(err);
      user
        .send({
          content:
            `You have been muted by a moderator in ${interaction.guild.name} for ${duration}.` +
            ` The reason for your mute is as follows:\n${reason}\nYour mute will expire automatically after the duration has ended.` +
            ` Please take this time to review the server rules to prevent further action against your account. Harassment of any kind toward` +
            ` moderators may result in referral to Discord staff.\nIf your mute is not automatically lifted after the expiration, you` +
            ` may message a moderator and request it to be manually removed.`,
        })
        .catch((err) => {
          console.log(err);
          const response = new EmbedBuilder()
            .setColor(config.messageColors.error)
            .setTitle("Message Failed")
            .setDescription(
              `Sending mute message to user @${user.username} failed. This is likely a result of their privacy settings.`
            )
            .setTimestamp();
          logsChannel.send({ embeds: [response] });
        });
      const response = new EmbedBuilder()
        .setColor(config.messageColors.memMute)
        .setTitle("User Muted")
        .setDescription(`User ${user.username} has been muted for ${userDuration}.`)
        .setTimestamp();
      return interaction.reply({
        content:
          "User successfully muted, but there was a problem logging to the database. Please inform the bot's administrator.",
        embeds: [response],
      });
    });
}
