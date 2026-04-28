// @ts-check
import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";
import { ModLogs } from "../../includes/index.js";

export const data = new SlashCommandBuilder()
  .setName("modlogs")
  .setDescription("Check logged moderation actions taken against a user.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  );
export async function execute(interaction) {
  const user = interaction.options.getUser("user");

  const warnings = await ModLogs.findAll({
    where: {
      loggedID: user.id,
    },
  }).catch((err) => {
    console.log(err);
  });

  let fields = [];
  for (let i = 0; warnings[i]; i++) {
    const warning = warnings[i];
    const id = warning.getDataValue("loggerID").toString();
    const mod = await interaction.client.users.fetch(id);
    let modName = "";
    if (!mod) modName = "(deleted or deactivated account)";
    else modName = mod.username;
    const logType = warning.getDataValue("logName");
    let reason = "Reason: ";
    switch (logType) {
      case "ban":
        reason += "**Member Banned**\nReason: ";
        break;
      case "kick":
        reason += "**Member Kicked**\nReason: ";
        break;
      case "unban":
        reason += "**Member Unbanned**\nReason: ";
        break;
      case "unmute":
        reason += "**Member Unmuted**\nReason: ";
        break;
    }
    if (logType.includes("mute") && logType !== "unmute") {
      const duration = logType.split(":");
      reason += "**Member Muted** for " + duration[1] + "-\nReason: ";
    }
    fields.push({
      name: "Warning #" + (i + 1) + " - Warning ID: #" + warning.getDataValue("id"),
      value:
        "User:\n(" +
        user.id +
        ")\n" +
        user.username +
        "\n" +
        reason +
        warning.getDataValue("message") +
        "\nModerator:\n(" +
        id +
        ")\n" +
        modName +
        "\nTime: " +
        warning.getDataValue("logTime"),
      inline: true,
    });
  }
  const response = new EmbedBuilder()
    .setColor(config.messageColors.memLogs)
    .setTitle(`Warnings for ${user.username}`)
    .addFields(fields)
    .setTimestamp();
  return interaction.reply({ embeds: [response] });
}
