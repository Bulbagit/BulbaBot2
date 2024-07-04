// @ts-check
/**
 * Event handler for logging deleted messages.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";

export const name = Events.MessageDelete;
export async function execute(message) {
  const guild = await message.client.guilds.fetch(config.guildID);
  const logsChannel = await guild.channels.fetch(config.logChannel);
  if (
    message.content.toLowerCase().includes("https://discord.gg") ||
    message.mentions.members?.size >= 7
  )
    return; // This is already handled by the message listener.
  if (!message.content && message.embeds.length) {
    let title = "";
    if (!message.embeds[0].title) title = message.embeds[0].author.name;
    else title = message.embeds[0].title;
    const response = new EmbedBuilder()
      .setColor(config.messageColors.messageDelete)
      .setTitle(`Message Deleted by ${message.author.username}`)
      .setThumbnail(message.author.displayAvatarURL())
      .setDescription("Message with embeds deleted.")
      .addFields([
        { name: `Message in ${message.channel.toString()}`, value: "(Embed)" },
        { name: "Embed Title", value: title },
        { name: "Embed Text", value: message.embeds[0].description },
      ])
      .setFooter({ text: "ID: " + message.author.id })
      .setTimestamp();
    return logsChannel.send({ embeds: [response] });
  }
  const response = new EmbedBuilder()
    .setColor(config.messageColors.messageDelete)
    .setTitle(`Message Deleted by ${message.author.username}`)
    .setThumbnail(message.author.displayAvatarURL())
    .setDescription(`Message sent by <@!${message.author.id}> deleted.`)
    .addFields({
      name: `Message in ${message.channel.toString()}`,
      value: message.content,
    })
    .setFooter({ text: `ID: ${message.author.id}` })
    .setTimestamp();
  return logsChannel.send({ embeds: [response] });
}
