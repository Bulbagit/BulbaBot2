// @ts-check
/**
 * Remove a user from the server and prevent them from re-joining.
 */
import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import sequelize from "../../includes/database/database.js";
import config from "../../config.js";
import { ModLogs } from "../../includes/database/index.js";
import { canModerate } from "../../includes/utils.js";

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Remove a user from the server and prevent them from re-joining.")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for ban.").setRequired(true)
  )
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user or their ID").setRequired(true)
  )
  .addStringOption((purgehours) =>
    purgehours
      .setName("purgehours")
      .setDescription("If supplied, purge last X hours worth of messages")
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const reason = interaction.options.getString("reason");
  let targetUser = interaction.options.getUser("user");
  const fullUser = await interaction.client.users.fetch(targetUser);
  const isInServer = await interaction.guild.members.fetch(targetUser).catch(() => null);
  let purgeHoursStr = interaction.options.getString("purgehours");
  let purgeSeconds = 0;

  if (purgeHoursStr !== null && !isNaN(Number(purgeHoursStr))) {
    purgeSeconds = Number(purgeHoursStr) * 60 * 60;
  }

  if (isInServer) {
    if (!canModerate(interaction.member, isInServer)) {
      interaction.client.emit("unauthorized", interaction.client, interaction.user, {
        command: "ban",
        details: `User ${interaction.user.username} attempted to ban ${fullUser.username}, giving the reason "${reason}"`,
      });

      return interaction.editReply({
        content:
          "The bot may not be used to perform moderation actions against other moderators or higher. This incident will be logged.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (fullUser.id === config.clientID) {
    return interaction.editReply({
      content: "I can't remove myself from the server.",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await sequelize.transaction(async (t) => {
      await ModLogs.create(
        {
          loggedID: fullUser.id,
          loggerID: interaction.user.id,
          logName: "ban",
          message: reason,
        },
        { transaction: t }
      );
    });

    const message =
      `You have been banned from ${interaction.guild.name} by a moderator. The reason provided is as follows:` +
      `\n${reason}` +
      `\nPlease be aware that harassment directed at any of the moderators may result in direct referral to Discord staff.`;

    let dmFailed = false;
    try {
      await fullUser.send({ content: message });
    } catch (err) {
      console.log(`Failed to send ban DM to ${fullUser.username} (likely privacy settings).`, err);
      dmFailed = true;
    }

    await interaction.guild.members.ban(fullUser, {
      reason: reason,
      deleteMessageSeconds: purgeSeconds,
    });

    const channel = await interaction.client.channels.fetch(config.logChannel);
    let lBanDescr = `Member <@!${fullUser.id}> (@${fullUser.username}) has been banned from the server by <@!${interaction.user.id}>.`;

    if (purgeSeconds > 0) {
      lBanDescr += `\n(Purged messages for ${purgeHoursStr} hour(s).)`;
    }

    const response = new EmbedBuilder()
      .setColor(config.messageColors.memBan)
      .setTitle("Member banned")
      .setDescription(lBanDescr)
      .addFields([{ name: "Reason", value: reason }])
      .setTimestamp();

    if (dmFailed) {
      response.setFooter({
        text: "Note: Could not DM the user about this ban (privacy settings).",
      });
    }

    if (channel) {
      await channel.send({ embeds: [response] });
    }

    return interaction.editReply({ embeds: [response] });
  } catch (err) {
    console.error("Error executing ban command:", err);

    const channel = await interaction.guild.channels.fetch(config.logChannel).catch(() => null);

    if (channel) {
      const response = new EmbedBuilder()
        .setColor(config.messageColors.error)
        .setTitle("Error processing ban")
        .setDescription(`An error occurred while trying to process the ban for <@!${fullUser.id}>.`)
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
        "Ban action failed. This may be due to a database error, missing permissions, or role hierarchy. Check the logs for more information.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
