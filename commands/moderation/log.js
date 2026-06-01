// @ts-check
/**
 * Log a warning for a user.
 */
import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";
import { ModLogs } from "../../includes/database/index.js";

export const data = new SlashCommandBuilder()
  .setName("log")
  .setDescription("Logs a warning for a user.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  )
  .addStringOption((reason) =>
    reason.setName("reason").setDescription("Reason for warning.").setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");

  try {
    // Log the actual warning
    const results = await ModLogs.create({
      loggedID: user.id,
      loggerID: interaction.user.id,
      logName: "warning",
      message: reason,
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
  } catch (err) {
    // Something went wrong. Log it.
    console.log(err);
    return interaction.reply({
      content: `There was an error logging to database.\nPlease inform the bot author.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
