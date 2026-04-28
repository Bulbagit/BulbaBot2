// @ts-check
/*
 * Report a user for poor behavior
 */

import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import sequelize from "../../includes/database.js";
import config from "../../config.js";
import { ReportLogs } from "../../includes/index.js";

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
  )
  .addChannelOption((channel) =>
    channel
      .setName("channel")
      .setDescription("The channel in which the incident occurred.")
      .setRequired(true)
  );
export async function execute(interaction) {
  const reportedUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  const channel = interaction.options.getChannel("channel");
  const reportsChannel = await interaction.guild.channels.fetch(config.reportChannel);
  const reportingUser = interaction.user;

  return sequelize
    .transaction(() => {
      return ReportLogs.create({
        reportedID: reportedUser.id,
        reporterID: reportingUser.id,
        message: reason,
        channel: channel.id,
      }).catch((err) => console.log(err));
    })
    .then((report) => {
      const response = new EmbedBuilder()
        .setTitle("New Report")
        .setDescription(`Report made against user ${reportedUser.username}`)
        .setThumbnail(reportedUser.avatarURL())
        .addFields(
          {
            name: "User (ID)",
            value: `${reportedUser} (${reportedUser.id})`,
          },
          { name: "Message", value: reason },
          { name: "Channel", value: channel.toString() }
        )
        .setFooter({ text: `Report ID: #${report.id}` })
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
            value: `${reportedUser} (${reportedUser.id})`,
          },
          { name: "Message", value: reason },
          { name: "Channel", value: channel.toString() },
          {
            name: "Warning!",
            value:
              "This report was not logged to the database due to an error. Please contact the bot's administrator.",
          }
        )
        .setFooter({ text: "Report ID: N/A (Database error)" })
        .setTimestamp();
      reportsChannel.send({ embeds: [response] });
      interaction.reply({
        content: "Your report has been submitted for review.",
        flags: MessageFlags.Ephemeral,
      });
    });
}
