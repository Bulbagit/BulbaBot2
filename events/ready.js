// @ts-check
/**
 * Event handler for logging bot start time.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";
import { Mutes } from "../includes/index.js";

export const name = Events.ClientReady;
export const once = true;
export async function execute(client) {
  const guild = await client.guilds.fetch(config.guildID);
  const logsChannel = await guild.channels.fetch(config.logChannel);
  const date = new Date();
  console.log(
    `Bot started on ${
      date.getMonth() + 1
    } ${date.getDate()}, ${date.getFullYear()} at ${date.getTime()} with username ${
      client.user.username
    }`
  );
  const mutes = await Mutes.findAll();
  if (mutes.length) {
    client.emit("unmute", client, mutes, true);
  }
  const restarted = new EmbedBuilder()
    .setTitle("Bot restarted")
    .setDescription(
      "Bot has been restarted, either manually or automatically after a crash. Please inform the bot's administrator."
    )
    .setTimestamp();
  return logsChannel.send({ embeds: [restarted] }).catch((err) => {
    console.log(err);
  });
}
