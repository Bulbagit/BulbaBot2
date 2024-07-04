// @ts-check
/**
 * Remove a user from the server without barring them from re-entry.
 */
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Sequelize from "sequelize";
import config from "../../config.js";
import { ModLogs } from "../../includes/index.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Remove a user from the server.")
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  )
  .addStringOption((reason) =>
    reason
      .setName("reason")
      .setDescription("Reason for kick.")
      .setRequired(true)
  );
export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const member = await interaction.guild.members.fetch(user);
  if (!member) return interaction.reply("Member is not present in server.");
  const reason = interaction.options.getString("reason");
  const modRole = await interaction.guild.roles.fetch(config.modID);
  if (
    !interaction.member.roles.cache.has(config.modID) &&
    !interaction.user.id !== config.adminID &&
    interaction.member.roles.highest.position < modRole.position
  ) {
    interaction.client.emit(
      "unauthorized",
      interaction.client,
      interaction.user,
      {
        command: "kick",
        target: user,
        reason: reason,
      }
    );
    return interaction.reply(
      "You are not authorized to perform this command. Repeated attempts to perform unauthorized actions may result in a ban."
    );
  }
  if (member.roles.highest.position >= modRole.position) {
    interaction.client.emit(
      "unauthorized",
      interaction.client,
      interaction.user,
      {
        command: "kick",
        target: user,
        reason: reason,
      }
    );
    return interaction.reply(
      "The bot may not be used to perform moderation actions against other moderators or higher. This incident will be logged."
    );
  }
  if (member.id === config.clientID)
    return interaction.reply("I can't remove myself from the server.");
  // Log the kick
  await sequelize
    .transaction(() => {
      return ModLogs.create({
        loggedID: user.id,
        loggerID: interaction.user.id,
        logName: "kick",
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
    `You have been kicked from ${interaction.guild.name} by a moderator. The reason provided is as follows:` +
    `\n${reason}` +
    `\nYou may rejoin, but you are encouraged to please review the server rules carefully to avoid further actions against your account.`;
  user
    .send({
      content: message,
    })
    .then(() => {
      member
        .kick(reason)
        .then(async () => {
          const channel = await interaction.client.channels.fetch(
            config.logChannel
          );
          const response = new EmbedBuilder()
            .setColor(config.messageColors.memKick)
            .setTitle("Member Kicked")
            .setDescription(
              `Member @${user.username} has been removed from the server by @${interaction.user.username}.`
            )
            .addFields([{ name: "Reason", value: reason }])
            .setTimestamp();
          channel.send({ embeds: [response] });
          return interaction.reply({ embeds: [response] });
        })
        .catch(async (err) => {
          console.log(err);
          const channel = await interaction.guild.channels.fetch(
            config.logChannel
          );
          const response = new EmbedBuilder()
            .setColor(config.messageColors.error)
            .setTitle("Error kicking user")
            .setDescription(
              `An error occurred while trying to kick @${user.username}. The error is displayed below.`
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
          return interaction.reply(
            "Kick unsuccessful. Check the logs for more information."
          );
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
          `Sending kick message to user @${user.username} failed. This is likely a result of their privacy settings.`
        )
        .setTimestamp();

      channel.send({ embeds: [response] });
      member
        .kick(reason)
        .then(async () => {
          const response = new EmbedBuilder()
            .setColor(config.messageColors.memKick)
            .setTitle("Member Kicked")
            .setDescription(
              `Member @${user.username} has been removed from the server by @${interaction.user.username}.`
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
            .setTitle("Error kicking user")
            .setDescription(
              `An error occurred while trying to kick @${user.username}. The error is displayed below.`
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
          return interaction.reply(
            "Kick unsuccessful. Check the logs for more information."
          );
        });
    });
}
