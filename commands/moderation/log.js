// @ts-check
/**
 * Log a warning for a user.
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
  .setName("log")
  .setDescription("Logs a warning for a user.")
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  )
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for warning.").setRequired(true)
  );
export async function execute(interaction) {
  const modRole = await interaction.guild.roles.fetch(config.modID);
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  if (interaction.member.roles.highest.position < modRole.position) {
    interaction.client.emit("unauthorized", interaction.client, interaction.user, {
      target: user,
      reason: reason,
      command: "log",
    });
    return interaction.reply(
      "You are not authorized to perform this command. Repeated attempts to perform unauthorized actions may result in a ban."
    );
  }

  // Log the actual warning
  const results = await sequelize
    .transaction(() => {
      return ModLogs.create({
        loggedID: user.id,
        loggerID: interaction.user.id,
        logName: "warning",
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

  // Success. Send the response.
  const response = new EmbedBuilder()
    .setColor(config.messageColors.memWarn)
    .setTitle(`Warning logged for ${user.username}`)
    .setDescription(
      `Warning ID #${results.dataValues.id}\n` + `Logged by ${interaction.user.username}`
    )
    .addFields({ name: "Warning", value: reason }, { name: "ID", value: user.id })
    .setTimestamp();
  interaction.reply({ embeds: [response] });
}
