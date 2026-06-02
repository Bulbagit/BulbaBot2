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

  for (const mute of expired) {
    const id = mute.getDataValue("mutedID");
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
    }
    // If everything succeeded, destroy the mute.
    await Mutes.destroy({ where: { mutedID: id } }).catch((err) => console.log(err));
  }
}
