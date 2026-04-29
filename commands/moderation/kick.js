// @ts-check
/**
 * Remove a user from the server without barring them from re-entry.
 */
import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import sequelize from "../../includes/database/database.js";
import config from "../../config.js";
import { ModLogs } from "../../includes/database/index.js";
import { canModerate } from "../../includes/utils.js";

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Remove a user from the server.")
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  )
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for kick.").setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const reason = interaction.options.getString("reason");
  const targetUser = interaction.options.getUser("user");
  const fullUser = await interaction.client.users.fetch(targetUser);
  const isInServer = await interaction.guild.members.fetch(targetUser).catch(() => null);

  if (!isInServer) {
    return interaction.editReply({
      content: "The user is not in the server, so they cannot be kicked.",
    });
  }

  if (!canModerate(interaction.member, isInServer)) {
    interaction.client.emit("unauthorized", interaction.client, interaction.user, {
      command: "kick",
      details: `User ${interaction.user.username} attempted to kick ${fullUser.username}, giving the reason "${reason}"`,
    });

    return interaction.editReply({
      content:
        "The bot may not be used to perform moderation actions against other moderators or higher. This incident will be logged.",
    });
  }

  if (fullUser.id === config.clientID) {
    return interaction.editReply({
      content: "I can't remove myself from the server.",
    });
  }

  try {
    await sequelize.transaction(async (t) => {
      await ModLogs.create(
        {
          loggedID: fullUser.id,
          loggerID: interaction.user.id,
          logName: "kick",
          message: reason,
        },
        { transaction: t }
      );
    });

    const message =
      `You have been kicked from ${interaction.guild.name} by a moderator. The reason provided is as follows:` +
      `\n${reason}` +
      `\nYou may rejoin the server, but you are encouraged to read the rules to prevent further action against your account.` +
      `\nIf you believe this was done in error, you may contact the moderators to request manual review. Please be aware that harassment directed at any of the moderators may result in direct referral to Discord staff.`;

    let dmFailed = false;
    try {
      await fullUser.send({ content: message });
    } catch {
      console.log(`Failed to send kick DM to ${fullUser.username} (likely privacy settings).`);
      dmFailed = true;
    }

    await interaction.guild.members.kick(fullUser, reason);

    const channel = await interaction.client.channels.fetch(config.logChannel);
    const response = new EmbedBuilder()
      .setColor(config.messageColors.memKick)
      .setTitle("Member kicked")
      .setDescription(
        `Member <@!${fullUser.id}> (@${fullUser.username}) has been kicked from the server by <@!${interaction.user.id}>.`
      )
      .addFields([{ name: "Reason", value: reason }])
      .setTimestamp();

    if (dmFailed) {
      response.setFooter({
        text: "Note: Could not DM the user about this kick (privacy settings).",
      });
    }

    if (channel) {
      await channel.send({ embeds: [response] });
    }

    return interaction.editReply({ embeds: [response] });
  } catch (err) {
    console.error("Error executing kick command:", err);

    const channel = await interaction.guild.channels.fetch(config.logChannel).catch(() => null);

    if (channel) {
      const response = new EmbedBuilder()
        .setColor(config.messageColors.error)
        .setTitle("Error processing kick")
        .setDescription(
          `An error occurred while trying to process the kick for <@!${fullUser.id}>.`
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
      content:
        "Kick action failed. This may be due to a database error, missing permissions, or role hierarchy. Check the logs for more information.",
    });
  }
}
