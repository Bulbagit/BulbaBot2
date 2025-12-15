// @ts-check
/**
 * Unarchive a channel.
 */
import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("pop")
  .setDescription("Unarchives a channel.")
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
  const modRole = await interaction.guild.roles.fetch(config.modID);
  const target = interaction.options.getChannel("channel");
  if (interaction.member.roles.highest.position < modRole.position) {
    interaction.client.emit("unauthorized", interaction.client, interaction.user, {
      command: "pop",
      details: `${interaction.user.username} attempted to pop the channel #${target}`,
    });
    return interaction.reply(
      "You are not authorized to perform this command. Repeated attempts to perform unauthorized actions may result in a ban."
    );
  }
  if (target.parentId !== config.archiveID)
    return interaction.reply({
      content: "Target must be an archived channel.",
      flags: MessageFlags.Epehemeral,
    });
  const category = interaction.options.getChannel("category");
  if (category.constructor.name !== "CategoryChannel")
    return interaction.reply({
      content: `#${category.name} is not a category.`,
      flags: MessageFlags.Epehemeral,
    });
  if (category.id === config.archiveID)
    return interaction.reply({
      content: "You must choose a category other than the archives.",
      flags: MessageFlags.Epehemeral,
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
