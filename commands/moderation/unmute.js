// @ts-check
/*
 * Unmute a user.
 */

import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";
import { Mutes, ModLogs } from "../../includes/database/index.js";

export const data = new SlashCommandBuilder()
  .setName("unmute")
  .setDescription("Manually remove a mute from a user.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((user) => user.setName("user").setDescription("The muted user.").setRequired(true))
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for removing the mute.").setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const logsChannel = await interaction.guild.channels.fetch(config.logChannel);
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");

  let member;
  try {
    member = await interaction.guild.members.fetch(user);
  } catch (err) {
    console.log(err);
    return interaction.editReply({
      content:
        "Something went wrong fetching server member.\n" + "They may not be present in the server.",
    });
  }
  if (!member.roles.cache.has(config.muteID))
    return interaction.editReply({ content: "This user is not currently muted." });

  const warnings = [];
  let dmFailed = false;

  try {
    await member.roles.remove(config.muteID);
  } catch (err) {
    // Error removing the role - stop now and warn the mod
    console.log(err);
    return interaction.editReply({
      content: "There was an error removing the muted role. Please inform the bot's administrator.",
    });
  }

  try {
    await Mutes.destroy({ where: { mutedID: user.id } });
  } catch (err) {
    console.log(err);
    warnings.push("The mute could not be removed from the database.");
  }

  try {
    await ModLogs.create({
      loggedID: user.id,
      loggerID: interaction.user.id,
      logName: "unmute",
      message: reason,
    });
  } catch (err) {
    console.log(err);
    warnings.push("Could not write to the moderation log. You may wish to log this manually.");
  }

  try {
    await user.send({
      content: `You have been manually unmuted in ${interaction.guild.name} by a moderator.\nReason: ${reason}`,
    });
  } catch (err) {
    console.log(err);
    dmFailed = true;
  }

  const response = new EmbedBuilder()
    .setColor(config.messageColors.memUnmute)
    .setTitle("Member Unmuted")
    .setDescription(`User ${user.username} was manually unmuted by ${interaction.user.username}`)
    .addFields([{ name: "Reason", value: reason }])
    .setTimestamp();
  if (dmFailed) response.setFooter({ text: "Note: Could not DM user." });
  if (warnings.length) response.addFields({ name: "Warnings", value: warnings.join("\n") });
  await logsChannel.send({ embeds: [response] });
  if (warnings.length)
    return interaction.editReply({
      content: `${user.username} has been unmuted, but there were errors. Check the logs channel for more information.`,
    });
  return interaction.editReply({ content: `${user.username} has been unmuted successfully.` });
}
