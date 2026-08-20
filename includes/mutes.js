/**
 * Contains the logic for checking the database for expired mutes.
 * It creates a job that gets called by the ready event via setInterval().
 * This runs every minute, scanning for expired mutes.
 * The mutes table is self-cleaning and rather small, so there isn't much overhead.
 * This replaces the old unmute event logic.
 */

import { Op } from "sequelize";
import { Mutes } from "./database/index.js";
import config from "../config.js";
import { EmbedBuilder } from "discord.js";

export async function sweepMutes(client) {
  let expired, guild;
  // First find expired mutes
  try {
    guild = await client.guilds.fetch(config.guildID);
    expired = await Mutes.findAll({ where: { unmutedTime: { [Op.lte]: new Date() } } });
  } catch (err) {
    // Critical failure; log and abort
    console.log(err);
    return;
  }

  const successfulUnmutes = [];

  for (const mute of expired) {
    const id = mute.getDataValue("mutedID");
    const name = mute.getDataValue("mutedName");
    const member = await guild.members.fetch(id).catch(() => null);
    if (member) {
      try {
        await member.roles.remove(config.muteID);
      } catch (err) {
        // Something went wrong; abort
        // @TODO: Emit a warning to the logs channel
        console.log(err);
        continue;
      }

      successfulUnmutes.push({ id, name });

      try {
        const message =
          `Your mute in ${guild.name} has been lifted automatically. You are free to return to chatting.\n` +
          "Please read the rules carefully to prevent further incidents.";
        await member.send({ content: message }); // Tell the member they're unmuted
      } catch {
        // DM failed; oh well
      }
    }
    // If everything succeeded, destroy the mute.
    await Mutes.destroy({ where: { mutedID: id } }).catch((err) => console.log(err));
  }

  if (successfulUnmutes.length) {
    const logsChannel = await guild.channels.fetch(config.logChannel).catch(() => null);
    if (!logsChannel) {
      console.log("Something went wrong attempting to fetch log channel.");
      return;
    }
    const unmutes = successfulUnmutes
      .map(({ id, name }) => `[${name}](https://discord.com/users/${id}) — \`${id}\``)
      .join("\n");
    const summary = new EmbedBuilder()
      .setColor(config.messageColors.memUnmute)
      .setTitle("Member(s) Unmuted")
      .setDescription(unmutes)
      .setTimestamp();
    logsChannel.send({ embeds: [summary] }).catch((err) => console.log(err));
  }
}
