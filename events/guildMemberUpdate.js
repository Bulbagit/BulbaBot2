// @ts-check
/**
 * Event handler for logging user name changes.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";

export const name = Events.GuildMemberUpdate;
export async function execute(member, newMember) {
  if (member.guild.id !== config.guildID) return;
  const logsChannel = await member.guild.channels.fetch(config.autologChannel);

  let displaymsg = "";

  if (member.nickname == null) {
    displaymsg = "Member nickname updated to " + newMember.nickname;
  } else if (newMember.nickname == null) {
    displaymsg = "Member nickname removed (was " + member.nickname + ")";
  } else {
    displaymsg = "Member nickname updated from " + member.nickname + " to " + newMember.nickname;
  }

  if (member.nickname !== newMember.nickname) {
    const response = new EmbedBuilder()
      .setColor(config.messageColors.memJoin)
      .setTitle(`Member Updated`)
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription(displaymsg)
      .setFooter({ text: `ID: ${member.id}` })
      .addFields([{ name: "User", value: `${member.user.username}` }])
      .setTimestamp();
    return logsChannel.send({ embeds: [response] }).catch((err) => console.log(err));
  }
}
