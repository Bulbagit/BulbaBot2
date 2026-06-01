// @ts-check
/*
 * Report a user for poor behavior
 */

import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";
import { ReportLogs } from "../../includes/database/index.js";

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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const reportedUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  const channel = interaction.options.getChannel("channel");
  const reportsChannel = await interaction.guild.channels.fetch(config.reportChannel);
  const reportingUser = interaction.user;

  let report;
  let dbFailed = false;

  try {
    // Try to log the report
    report = await ReportLogs.create({
      reportedID: reportedUser.id,
      reporterID: reportingUser.id,
      message: reason,
      channel: channel.id,
    });
  } catch (err) {
    console.log(err);
    dbFailed = true;
  }

  try {
    // Send a message to the mods.
    const response = new EmbedBuilder()
      .setTitle("New Report")
      .setDescription(`Report made against user ${reportedUser.username}`)
      .setThumbnail(reportedUser.displayAvatarURL())
      .addFields(
        {
          name: "User (ID)",
          value: `${reportedUser} (${reportedUser.id})`,
        },
        { name: "Message", value: reason },
        { name: "Channel", value: channel.toString() }
      )
      .setTimestamp();

    if (dbFailed) {
      // We don't need to abort; just warn the moderators it didn't log
      response.addFields({
        name: "Warning!",
        value:
          "This report was not logged to the database due to an error. Please contact the bot's administrator.",
      });
      response.setFooter({ text: "Report ID: N/A (Database error)" });
    } else {
      response.setFooter({ text: `Report ID: #${report.id}` });
    }
    await reportsChannel.send({ embeds: [response] });
  } catch (err) {
    console.log(err);
    // This is bad; report failed to deliver. Warn the user so they are aware.
    return interaction.editReply({
      content: "Your report was not delivered due to an error. Please notify a moderator.",
    });
  }

  return interaction.editReply({ content: "Your report has been submitted for review." });
}
