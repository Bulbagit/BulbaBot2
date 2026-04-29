// @ts-check
/**
 * Remove a user from the server and prevent them from re-joining.
 */
import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import sequelize from "../../includes/database.js";
import config from "../../config.js";
import { ModLogs } from "../../includes/index.js";
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

      return interaction.reply({
        content:
          "The bot may not be used to perform moderation actions against other moderators or higher. This incident will be logged.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (fullUser.id === config.clientID)
    return interaction.reply({
      content: "I can't remove myself from the server.",
      flags: MessageFlags.Ephemeral,
    });

  // Log the ban
  await sequelize
    .transaction(() => {
      return ModLogs.create({
        loggedID: fullUser.id,
        loggerID: interaction.user.id,
        logName: "ban",
        message: reason,
      });
    })
    .catch((err) => {
      // Error. Log it and tell the mod it failed.
      console.log(err);

      return interaction.reply(
        `There was an error logging to database:\n${err}\nPlease inform the bot author.`
      );
    });

  const message =
    `You have been banned from ${interaction.guild.name} by a moderator. The reason provided is as follows:` +
    `\n${reason}` +
    `\nPlease be aware that harassment directed at any of the moderators may result in direct referral to Discord staff.`;

  fullUser
    .send({
      content: message,
    })
    .then(() => {
      interaction.guild.members
        .ban(fullUser, { reason: reason, deleteMessageSeconds: purgeSeconds })
        .then(async () => {
          const channel = await interaction.client.channels.fetch(config.logChannel);

          let lBanDescr = `Member @${fullUser.username} has been banned from the server by @${interaction.user.username}.`;

          if (purgeSeconds > 0) {
            lBanDescr = lBanDescr + " (Purged messages for " + purgeHoursStr + " hour(s).)";
          }

          const response = new EmbedBuilder()
            .setColor(config.messageColors.memBan)
            .setTitle("Member banned")
            .setDescription(lBanDescr)
            .addFields([{ name: "Reason", value: reason }])
            .setTimestamp();
          channel.send({ embeds: [response] });

          return interaction.reply({ embeds: [response] });
        })
        .catch(async (err) => {
          console.log(err);

          const channel = await interaction.guild.channels.fetch(config.logChannel);
          const response = new EmbedBuilder()
            .setColor(config.messageColors.error)
            .setTitle("Error banning user")
            .setDescription(
              `An error occurred while trying to ban @${fullUser.username}. The error is displayed below.`
            )
            .addFields([
              {
                name: "Moderator",
                value: `@${interaction.user.username}`,
              },
              {
                name: "Reason",
                value: reason,
              },
            ])
            .setTimestamp();
          channel.send({ embeds: [response] });

          return interaction.reply("Ban unsuccessful. Check the logs for more information.");
        });
    })
    .catch(async (err) => {
      console.log(err);
      const guild = await interaction.client.guilds.fetch(config.guildID);
      const channel = await guild.channels.fetch(config.logChannel);
      const response = new EmbedBuilder()
        .setColor(config.messageColors.error)
        .setTitle("Message Failed")
        .setDescription(
          `Sending ban message to user @${fullUser.username} failed. This is likely a result of their privacy settings.`
        )
        .setTimestamp();

      channel.send({ embeds: [response] });
      interaction.guild.members
        .ban(fullUser, { reason: reason, deleteMessageSeconds: purgeSeconds })
        .then(async () => {
          const response = new EmbedBuilder()
            .setColor(config.messageColors.memBan)
            .setTitle("Member banned")
            .setDescription(
              `Member @${fullUser.username} has been removed from the server by @${interaction.user.username}.`
            )
            .addFields([{ name: "Reason", value: reason }])
            .setTimestamp();
          channel.send({ embeds: [response] });

          return interaction.reply({ embeds: [response] });
        })
        .catch(async (err) => {
          console.log(err);

          const response = new EmbedBuilder()
            .setColor(config.messageColors.error)
            .setTitle("Error banning user")
            .setDescription(
              `An error occurred while trying to ban @${fullUser.username}. The error is displayed below.`
            )
            .addFields(
              { name: "Error", value: err },
              {
                name: "Moderator",
                value: `@${interaction.user.username}`,
              }
            )
            .setTimestamp();
          channel.send({ embeds: [response] });

          return interaction.reply("Ban unsuccessful. Check the logs for more information.");
        });
    });
}
