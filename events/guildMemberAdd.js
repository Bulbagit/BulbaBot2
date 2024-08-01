// @ts-check
/**
 * Event handler for logging when a user joins the server.
 */
import { EmbedBuilder, Events } from "discord.js";
import Sequelize from "sequelize";
import config from "../config.js";
import { Mutes } from "../includes/index.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

export const name = Events.GuildMemberAdd;
export async function execute(member) {
  const logsChannel = await member.guild.channels.fetch(config.logChannel);
  const isMuted = await Mutes.findOne({
    where: {
      mutedID: member.id,
    },
  });

  if (isMuted !== null) {
    await member.roles
      .add(config.muteID, "Reapplied existing mute")
      .then(() => {
        const response = new EmbedBuilder()
          .setColor(config.messageColors.memJoin)
          .setTitle("Muted Member Joined")
          .setThumbnail(member.user.displayAvatarURL())
          .setDescription(
            "<@!" + member.id + "> (" + member.user.username + ")"
          )
          .addFields([
            { name: "Account created at: ", value: `${member.user.createdAt}` },
            {
              name: "Mute details",
              value:
                "Muted at: " +
                isMuted.getDataValue("mutedTime") +
                "\n" +
                "Mute duration: " +
                isMuted.getDataValue("duration") +
                "\n" +
                "Unmute time: " +
                isMuted.getDataValue("unmutedTime"),
            },
          ])
          .setFooter({ text: `ID: ${member.id}` })
          .setTimestamp();

        return logsChannel
          .send({ embeds: [response] })
          .catch((err) => console.log(err));
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    const response = new EmbedBuilder()
      .setColor(config.messageColors.memJoin)
      .setTitle(`Member Joined`)
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription("<@!" + member.id + "> (" + member.user.username + ")")
      .addFields([
        { name: "Account created at: ", value: `${member.user.createdAt}` },
      ])
      .setFooter({ text: `ID: ${member.id}` })
      .setTimestamp();

    return logsChannel
      .send({ embeds: [response] })
      .catch((err) => console.log(err));
  }
}
