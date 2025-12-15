// @ts-check
/**
 * Event handler for logging when a user leaves the server.
 */
import { EmbedBuilder, Events } from "discord.js";
import { Op as _Op, literal } from "sequelize";
import config from "../config.js";
import { ModLogs } from "../includes/index.js";
const Op = _Op;

export const name = Events.GuildMemberRemove;
export async function execute(member) {
  // Wait a few seconds so any kicks or bans can get logged and caught by our check
  setTimeout(this.checkRemoved, 2000, member);
}
export async function checkRemoved(member) {
  const logsChannel = await member.guild.channels.fetch(config.logChannel);
  ModLogs.findAll({
    where: {
      loggedID: member.id,
      [Op.or]: [{ logName: "ban" }, { logName: "kick" }],
      logTime: {
        [Op.gte]: literal("DATE_SUB(NOW(), INTERVAL 1 MINUTE)"),
      },
    },
  })
    .then((result) => {
      if (!result.length) {
        const response = new EmbedBuilder()
          .setColor(config.messageColors.memLeave)
          .setTitle("Member Left")
          .setThumbnail(member.user.displayAvatarURL())
          .setDescription("<@!" + member.id + "> (" + member.user.username + ")")
          .setFooter({ text: `ID:  ${member.id}` })
          .setTimestamp();
        logsChannel.send({ embeds: [response] }).catch((err) => console.log(err));
      }
    })
    .catch((err) => {
      console.log(err);
    });
}
