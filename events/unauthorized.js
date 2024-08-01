// @ts-check
/**
 * Custom event handler for when a user attempts to use a command they are not
 * authorized for.
 */
import { EmbedBuilder, Events } from "discord.js";
import config from "../config.js";

Events.Unauthorized = "unauthorized";

export const name = Events.Unauthorized;
export async function execute(client, user, data) {
  // Our guild info cannot be passed to this event, so fetch it from client
  const guild = await client.guilds.fetch(config.guildID);
  const member = await client.users.fetch(user);
  const logsChannel = await guild.channels.fetch(config.logChannel);
  const command = data.command;

  const response = new EmbedBuilder()
    .setColor(config.messageColors.misuseWarn)
    .setTitle("Unauthorized User")
    .setDescription(`Attempted use of ${command} by <@!${member.username}>`)
    .addFields([{ name: "Details", value: `${data.details}` }])
    .setTimestamp();

  logsChannel.send({ embeds: [response] }).catch((err) => console.log(err));
}
