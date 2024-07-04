// @ts-check
/**
 * Archive a channel.
 */
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("stash")
  .setDescription("Archives a channel.")
  .addChannelOption((channel) =>
    channel
      .setName("channel")
      .setDescription("The channel to archive.")
      .setRequired(true)
  );
export async function execute(interaction) {
  const modRole = await interaction.guild.roles.fetch(config.modID);
  const target = interaction.options.getChannel("channel");
  if (interaction.member.roles.highest.position < modRole.position) {
    interaction.client.emit(
      "unauthorized",
      interaction.client,
      interaction.user,
      {
        command: "stash",
        details: `${interaction.user.username} attempted to stash the channel #${target}`,
      }
    );
    return interaction.reply(
      "You are not authorized to perform this command. Repeated attempts to perform unauthorized actions may result in a ban."
    );
  }
  if (target.parentId === config.archiveID)
    return interaction.reply({
      content: "Channel is already archived.",
      ephemeral: true,
    });

  target.setParent(config.archiveID);
  const channel = await interaction.guild.channels.fetch(config.logChannel);
  const response = new EmbedBuilder()
    .setColor(config.messageColors.success)
    .setTitle("Stash successful")
    .setDescription(
      `Channel ${target.name} successfully archived by ${interaction.user.username}.`
    )
    .setTimestamp();
  channel.send({ embeds: [response] });
  interaction.reply(`Channel ${target.name} successfully archived.`);
}
