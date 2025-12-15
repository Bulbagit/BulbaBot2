// @ts-check
/*
 * Report a user for poor behavior
 */

import { EmbedBuilder, MessageFlags, SlashCommandBuilder, userMention } from "discord.js";
import Sequelize from "sequelize";
import config from "../../config.js";
import { ReportLogs } from "../../includes/index.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

export const data = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Report a user for poor or offensive behavior.")
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  )
  .addStringOption((reason) =>
    reason
      .setName("reason")
      .setDescription("How the user in question is breaking the rules.")
      .setRequired(true)
  );
export async function execute(interaction) {
  const reportedUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  const reportsChannel = await interaction.guild.channels.fetch(config.reportChannel);
  const reportingUser = interaction.user;

  return sequelize
    .transaction(() => {
      return ReportLogs.create({
        reportedID: reportedUser.id,
        reporterID: reportingUser.id,
        message: reason,
      }).catch((err) => console.log(err));
    })
    .then(() => {
      const response = new EmbedBuilder()
        .setTitle("New Report")
        .setDescription(`Report made against user ${reportedUser.username}`)
        .setThumbnail(reportedUser.avatarURL())
        .addFields(
          {
            name: "User (ID)",
            value: `${userMention(reportedUser)} (${reportedUser.id})`,
          },
          { name: "Message", value: reason }
        )
        .setTimestamp();
      reportsChannel.send({ embeds: [response] });
      interaction.reply({
        content: "Your report has been submitted for review.",
        flags: MessageFlags.Ephemeral,
      });
    })
    .catch((err) => {
      console.log(err);
      const response = new EmbedBuilder()
        .setTitle("New Report")
        .setDescription(`Report made against user ${reportedUser.username}`)
        .setThumbnail(reportedUser.avatarURL())
        .addFields(
          {
            name: "User (ID)",
            value: `${userMention(reportedUser.id)} (${reportedUser.id})`,
          },
          { name: "Message", value: reason },
          {
            name: "Warning!",
            value:
              "This report was not logged to the database due to an error. Please contact the bot's administrator.",
          }
        )
        .setTimestamp();
      reportsChannel.send({ embeds: [response] });
      interaction.reply({
        content: "Your report has been submitted for review.",
        flags: MessageFlags.Epehemeral,
      });
    });
}
