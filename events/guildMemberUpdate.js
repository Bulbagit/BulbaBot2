// @ts-check
/**
 * Event handler for logging deleted messages.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";

export const name = Events.GuildMemberUpdate;
export async function execute(member, newmember) {
  if (member.guildID !== config.guildID)
    return;
  const logsChannel = await member.guild.channels.fetch(config.logChannel);

  let displaymsg = "";

  if (member.nickname == null) {
    displaymsg = "Member nickname updated to " + newmember.nickname;
  } else if (newmember.nickname == null) {
    displaymsg = "Member nickname removed (was " + member.nickname + ")";
  } else {
    displaymsg =
      "Member nickname updated from " +
      member.nickname +
      " to " +
      newmember.nickname;
  }

  if (member.nickname != newmember.nickname) {
    const response = new EmbedBuilder()
      .setColor(config.messageColors.memJoin)
      .setTitle(`Member Updated`)
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription(displaymsg)
      .setFooter({ text: `ID: ${member.id}` })
      .addFields([{ name: "User", value: `${member.user.username}` }])
      .setTimestamp();
    return logsChannel
      .send({ embeds: [response] })
      .catch((err) => console.log(err));
  }
}
