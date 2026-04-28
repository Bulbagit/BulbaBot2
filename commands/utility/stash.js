// @ts-check
/**
 * Archive a channel.
 */
import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("stash")
  .setDescription("Archives a channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((channel) =>
    channel.setName("channel").setDescription("The channel to archive.").setRequired(true)
  );
export async function execute(interaction) {
  const target = interaction.options.getChannel("channel");

  if (target.parentId === config.archiveID)
    return interaction.reply({
      content: "Channel is already archived.",
      flags: MessageFlags.Ephemeral,
    });

  target.setParent(config.archiveID);
  const channel = await interaction.guild.channels.fetch(config.logChannel);
  const response = new EmbedBuilder()
    .setColor(config.messageColors.success)
    .setTitle("Stash successful")
    .setDescription(`Channel ${target.name} successfully archived by ${interaction.user.username}.`)
    .setTimestamp();
  channel.send({ embeds: [response] });
  interaction.reply(`Channel ${target.name} successfully archived.`);
}
