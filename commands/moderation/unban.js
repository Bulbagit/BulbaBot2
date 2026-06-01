// @ts-check
/**
 * Lift a ban from a user.
 */
import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";
import { ModLogs } from "../../includes/database/index.js";

export const data = new SlashCommandBuilder()
  .setName("unban")
  .setDescription("Remove a ban from a user, allowing them to rejoin.")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addStringOption((user) =>
    user.setName("user").setDescription(`The banned user's ID.`).setRequired(true)
  )
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for lifting the ban.").setRequired(true)
  );
export async function execute(interaction) {
  const logsChannel = await interaction.guild.channels.fetch(config.logChannel);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const userID = interaction.options.getString("user");
  let user;
  try {
    user = await interaction.client.users.fetch(userID);
  } catch (err) {
    console.log(err);
    return interaction.editReply({ content: `No user found with ID ${userID}.` });
  }

  const reason = interaction.options.getString("reason");
  const warnings = [];
  let dmFailed = false;

  try {
    await interaction.guild.members.unban(user, reason);
  } catch (err) {
    console.log(err);
    return interaction.editReply({ content: "There was an error lifting this user's ban." });
  }
  try {
    await ModLogs.create({
      loggedID: user.id,
      loggerID: interaction.user.id,
      logName: "unban",
      message: reason,
    });
  } catch (err) {
    console.log(err);
    warnings.push("Failed to log this event in the database.");
  }
  try {
    const message =
      `Your ban in ${interaction.guild.name} has been lifted by a moderator. The reason provided is as follows:` +
      `\n${reason}` +
      `\nYou may now rejoin the server if you like. Please read the rules carefully to avoid any further incidents.`;
    await user.send({ content: message });
  } catch (err) {
    console.log(err);
    dmFailed = true;
  }

  // Success messages
  const response = new EmbedBuilder()
    .setColor(config.messageColors.memUnban)
    .setTitle("Member Unbanned")
    .setDescription(`User ${user.username} was manually unbanned by ${interaction.user.username}`)
    .addFields([{ name: "Reason", value: reason }])
    .setTimestamp();
  if (dmFailed) response.setFooter({ text: "Note: Could not DM user." });
  if (warnings.length) response.addFields({ name: "Warnings", value: warnings.join("\n") });
  await logsChannel.send({ embeds: [response] });
  if (warnings.length)
    return interaction.editReply({
      content: `${user.username} has been unbanned, but there were errors. Check the logs channel for more information.`,
    });
  return interaction.editReply({ content: `${user.username} has been unbanned successfully.` });
}
