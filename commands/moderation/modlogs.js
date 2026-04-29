// @ts-check
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import config from "../../config.js";
import { ModLogs } from "../../includes/database/index.js";

export const data = new SlashCommandBuilder()
  .setName("modlogs")
  .setDescription("Check logged moderation actions taken against a user.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addUserOption((user) =>
    user.setName("user").setDescription("The offending user.").setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  const user = interaction.options.getUser("user");
  const warnings = await ModLogs.findAll({
    where: {
      loggedID: user.id,
    },
    order: [["logTime", "DESC"]],
  }).catch((err) => {
    console.log(err);
  });

  if (!warnings || warnings.length === 0) {
    return interaction.editReply(`No warnings found for ${user.username}.`);
  }

  const itemsPerPage = 6;
  const totalPages = Math.ceil(warnings.length / itemsPerPage);
  let currentPage = 0;

  const generateEmbed = async (page) => {
    const start = page * itemsPerPage;
    const currentWarnings = warnings.slice(start, start + itemsPerPage);

    let fields = [];
    for (let i = 0; i < currentWarnings.length; i++) {
      const warning = currentWarnings[i];
      const id = warning.getDataValue("loggerID").toString();

      const mod = await interaction.client.users.fetch(id).catch(() => null);
      const modName = mod ? mod.username : "(deleted or deactivated account)";

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
        const timeVal = duration.length > 1 ? duration[1] : "an unspecified time";
        reason += "**Member Muted** for " + timeVal + "-\nReason: ";
      }

      fields.push({
        name: `Warning #${warnings.length - (start + i)} - Warning ID: #${warning.getDataValue("id")}`,
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

    return new EmbedBuilder()
      .setColor(config.messageColors.memLogs)
      .setTitle(`Warnings for ${user.username} (Page ${page + 1} of ${totalPages})`)
      .addFields(fields)
      .setTimestamp();
  };

  const getButtons = (page) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages - 1)
    );
  };

  const initialEmbed = await generateEmbed(currentPage);
  const message = await interaction.editReply({
    embeds: [initialEmbed],
    components: totalPages > 1 ? [getButtons(currentPage)] : [],
  });

  if (totalPages === 1) return;

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000, // Buttons expire after 2 minutes to save memory
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: "You cannot use these buttons.", ephemeral: true });
    }

    if (i.customId === "prev") {
      currentPage--;
    } else if (i.customId === "next") {
      currentPage++;
    }

    const newEmbed = await generateEmbed(currentPage);
    await i.update({
      embeds: [newEmbed],
      components: [getButtons(currentPage)],
    });
  });

  collector.on("end", () => {
    interaction.editReply({ components: [] }).catch(() => {});
  });
}
