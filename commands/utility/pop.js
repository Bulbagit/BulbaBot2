// @ts-check
/**
 * Unarchive a channel.
 */
import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("pop")
  .setDescription("Unarchives a channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((channel) =>
    channel.setName("channel").setDescription("The archived channel.").setRequired(true)
  )
  .addChannelOption((category) =>
    category
      .setName("category")
      .setDescription("The category to place the channel under.")
      .setRequired(true)
  );
export async function execute(interaction) {
  const target = interaction.options.getChannel("channel");

  if (target.parentId !== config.archiveID)
    return interaction.reply({
      content: "Target must be an archived channel.",
      flags: MessageFlags.Ephemeral,
    });
  const category = interaction.options.getChannel("category");
  if (category.constructor.name !== "CategoryChannel")
    return interaction.reply({
      content: `#${category.name} is not a category.`,
      flags: MessageFlags.Ephemeral,
    });
  if (category.id === config.archiveID)
    return interaction.reply({
      content: "You must choose a category other than the archives.",
      flags: MessageFlags.Ephemeral,
    });

  target.setParent(category);
  const channel = await interaction.guild.channels.fetch(config.logChannel);
  const response = new EmbedBuilder()
    .setColor(config.messageColors.success)
    .setTitle("Pop successful")
    .setDescription(
      `Channel ${target.name} successfully unarchived to category ${category.name} by ${interaction.user.username}`
    )
    .setTimestamp();
  channel.send({ embeds: [response] });
  interaction.reply(`Channel ${target.name} successfully unarchived to category ${category.name}.`);
}
