// @ts-check
/**
 * Event handler for logging edited messages.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";

export const name = Events.MessageUpdate;
export async function execute(oldMessage, newMessage) {
  // Creating an embed fires this event. This check prevents an error from crashing the bot and also prevents
  // logging messages with embeds.
  if (
    oldMessage.author.bot ||
    newMessage.author.bot ||
    oldMessage.content === newMessage.content ||
    !oldMessage.guild ||
    !newMessage.guild
  )
    return;
  // No idea what can cause this, but this should stop crashes.
  if (!newMessage.member)
    return console.log(
      `Strange behavior on message update. newMessage:\n${newMessage}\noldMessage:\n${oldMessage}`
    );
  let oldContent = oldMessage.content, newContent = newMessage.content;
  // Avoid sending invalid data to the embed fields.
  if (!oldMessage.content) oldContent = "*[No text]*";
  if (oldMessage.content?.length > 1024) oldContent = oldMessage.content.substring(0, 1021) + "...";
  if (!newMessage.content) newContent = "*[No text]*";
  if (newMessage.content?.length > 1024) newContent = newMessage.content.substring(0, 1021) + "...";


  const logsChannel = await oldMessage.guild.channels.fetch(config.autologChannel);
  const response = new EmbedBuilder()
    .setColor(config.messageColors.messageEdit)
    .setTitle(`Message edited by ${newMessage.author.username}`)
    .setThumbnail(newMessage.author.avatarURL())
    .setDescription(`Message edited in ${oldMessage.channel.toString()}`)
    .addFields([
      { name: "Before:", value: oldContent },
      { name: "After:", value: newContent },
    ])
    .setFooter({ text: `ID: ${newMessage.author.id}` })
    .setTimestamp();
  logsChannel.send({ embeds: [response] });
}
