// @ts-check
/**
 * Tells the bot to unmute a user. Handles scheduled unmutes,
 * and is also invoked upon discovering any stalled unmutes on restart.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";
import { Mutes } from "../includes/index.js";

Events.Unmute = "unmute";

export const name = Events.Unmute;
export async function execute(client, mutes, fromStartup) {
  const guild = await client.guilds.fetch(config.guildID);
  const logsChannel = await guild.channels.fetch(config.autologChannel);
  // mutes is an array passed by the startup event here
  if (fromStartup) {
    let pending = [],
      unmutes = [];
    for (const mute of mutes) {
      const member = await guild.members.fetch(mute.getDataValue("mutedID")).catch((err) => {
        console.log(err);
      });
      if (!member) continue;
      const timeToUnmute = new Date(mute.getDataValue("unmutedTime")).getTime();
      const now = new Date().getTime();
      const duration = timeToUnmute - now;

      if (duration <= 0) {
        member.roles.remove(config.muteID).catch((err) => {
          console.log(err);
        });
        await Mutes.destroy({ where: { mutedID: member.user.id } });
        unmutes.push({
          name: mute.getDataValue("mutedName"),
          value: `Mute expired at ${mute.getDataValue("unmutedTime")}.`,
          inline: true,
        });
      } else {
        pending.push({
          name: mute.getDataValue("mutedName"),
          value:
            "Muted for " +
            mute.getDataValue("duration") +
            " at " +
            mute.getDataValue("mutedTime") +
            ".\n" +
            "Unmute scheduled at " +
            mute.getDataValue("unmutedTime") +
            ".",
          inline: true,
        });
        console.log(timeToUnmute);
        setTimeout(() => {
          client.emit("unmute", client, member.user.id, false);
        }, duration);
      }
    }
    if (unmutes.length) {
      const doneUnmutes = new EmbedBuilder()
        .setTitle("Users Unmuted")
        .setDescription(
          "The following users have expired mutes that were not properly lifted. They have been automatically unmuted."
        )
        .addFields(unmutes)
        .setTimestamp();
      logsChannel.send({ embeds: [doneUnmutes] }).catch((err) => {
        console.log(err);
      });
    }
    if (pending.length) {
      const pendingUnmutes = new EmbedBuilder()
        .setTitle("Pending unmutes")
        .setDescription(
          "The following users are still muted. Information about their mutes follows."
        )
        .addFields(pending)
        .setTimestamp();
      logsChannel.send({ embeds: [pendingUnmutes] }).catch((err) => {
        console.log(err);
      });
    }
  } else {
    // mutes in this case should just be a single ID
    const member = await guild.members.fetch(mutes);
    if (!member.roles.cache.has(config.muteID)) return;
    member.roles
      .remove(config.muteID)
      .then(() => {
        Mutes.destroy({ where: { mutedID: member.user.id } }).catch((err) => {
          console.log(err);
          const alert = new EmbedBuilder()
            .setColor(config.messageColors.error)
            .setTitle("Database error")
            .setDescription(
              `There was an error removing the mute for ${member.user.username} from the database. Please inform the bot's administrator.`
            )
            .setTimestamp();
          logsChannel.send({ embeds: [alert] });
        });
        const response = new EmbedBuilder()
          .setColor(config.messageColors.memUnmute)
          .setTitle("Mute expired")
          .setDescription(
            `Member ${member.user.username} has had their mute expire. The role has been removed successfully.`
          )
          .setTimestamp();
        logsChannel.send({ embeds: [response] });
        member.user.send({
          content: `Your mute in ${guild.name} has expired.`,
        });
      })
      .catch((err) => {
        console.log(err);
        const alert = new EmbedBuilder()
          .setColor(config.messageColors.error)
          .setTitle("Unmute failure")
          .setDescription(
            `Unmute of ${member.user.username} failed. Please inform the bot's administrator.`
          )
          .setTimestamp();
        logsChannel.send({ embeds: [alert] });
      });
  }
}
