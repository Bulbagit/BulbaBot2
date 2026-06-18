// @ts-check
/**
 * Event handler that runs when the bot restarts.
 * Also starts our sweepMutes job.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";
import { sweepMutes } from "../includes/mutes.js";

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

  // Check for stuck mutes
  await sweepMutes(client);
  // And then set up our database sweep job to persistently check each minute
  setInterval(sweepMutes, 60000, client);

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
