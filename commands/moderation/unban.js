// @ts-check
/**
 * Lift a ban from a user.
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
  .setName("unban")
  .setDescription("Remove a ban from a user, allowing them to rejoin.")
  .addStringOption((user) =>
    user.setName("user").setDescription(`The banned user's ID.`).setRequired(true)
  )
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for lifting the ban.").setRequired(true)
  );
export async function execute(interaction) {
  const userID = interaction.options.getString("user");
  const user = await interaction.client.users.fetch(userID);
  if (!user) return interaction.reply(`No user found with ID ${userID}.`);
  const reason = interaction.options.getString("reason");
  const modRole = await interaction.guild.roles.fetch(config.modID);
  if (
    !interaction.member.roles.cache.has(config.modID) &&
    !interaction.user.id !== config.adminID &&
    interaction.member.roles.highest.position < modRole.position
  ) {
    interaction.client.emit("unauthorized", interaction.client, interaction.user, {
      command: "unban",
      details: "",
    });
    return interaction.reply(
      "You are not authorized to perform this command. Repeated attempts to perform unauthorized actions may result in a ban."
    );
  }
  // Log this
  await sequelize
    .transaction(() => {
      return ModLogs.create({
        loggedID: user.id,
        loggerID: interaction.user.id,
        logName: "unban",
        message: reason,
      });
    })
    .catch((err) => {
      // Error. Log it and tell the mod it failed.
      console.log(err);
      return interaction.channel.send(
        `There was an error logging to database. Please inform the bot administrator.`
      );
    });

  interaction.guild.members
    .unban(user, reason)
    .then(async () => {
      // Unban successful
      const message =
        `Your ban in ${interaction.guild.name} has been lifted by a moderator. The reason provided is as follows:` +
        `\n${reason}` +
        `\nYou may now rejoin the server if you like. Please read the rules carefully to avoid any further incidents.`;
      user
        .send({
          content: message,
        })
        .catch(async (err) => {
          // Failed to message the user
          console.log(err);
          const guild = await interaction.client.guilds.fetch(config.guildID);
          const channel = await guild.channels.fetch(config.logChannel);
          const response = new EmbedBuilder()
            .setColor(config.messageColors.error)
            .setTitle("Message Failed")
            .setDescription(
              `Sending unban message to user ${user.username} failed. This is likely a result of their privacy settings.`
            )
            .setTimestamp();

          channel.send({ embeds: [response] });
        });
      const channel = await interaction.client.channels.fetch(config.logChannel);
      const response = new EmbedBuilder()
        .setColor(config.messageColors.memUnban)
        .setTitle("Member unbanned")
        .setDescription(
          `User ${user.username} has been unbanned from the server by @${interaction.user.username}.`
        )
        .addFields([{ name: "Reason", value: reason }])
        .setTimestamp();
      channel.send({ embeds: [response] });
      return interaction.reply({ embeds: [response] });
    })
    .catch(async (err) => {
      // Unban failed
      console.log(err);
      const channel = await interaction.guild.channels.fetch(config.logChannel);
      const response = new EmbedBuilder()
        .setColor(config.messageColors.error)
        .setTitle("Error unbanning user")
        .setDescription(
          `An error occurred while trying to unban ${user.username}. The error is displayed below.`
        )
        .addFields([
          { name: "Moderator", value: `${interaction.user.username}` },
          { name: "Reason", value: reason },
        ])
        .setTimestamp();
      channel.send({ embeds: [response] });
      return interaction.reply("Unban unsuccessful. Check the logs for more information.");
    });
}
