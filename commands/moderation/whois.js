// @ts-check
/*
 * Gather all information about a user.
 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

export const data = new SlashCommandBuilder()
  .setName("whois")
  .setDescription("Displays information about a user account.")
  .addUserOption((user) =>
    user.setName("user").setDescription("User to inspect.").setRequired(true)
  );
export async function execute(interaction) {
  let user = interaction.options.getUser("user");
  const modRole = await interaction.guild.roles.fetch(config.modID);
  if (interaction.member.roles.highest.position < modRole.position) {
    interaction.client.emit(
      "unauthorized",
      interaction.client,
      interaction.user,
      {
        command: "whois",
        details: `${interaction.user.username} attempted to whois ${user.username}`,
      }
    );
    return interaction.reply(
      "You are not authorized to perform this command. Repeated attempts to perform unauthorized actions may result in a ban."
    );
  }
  const member = await interaction.guild.members.fetch(user).catch((err) => {
    console.log(err);
  });

  let status = [];
  let game = [];
  if (member && member.presence && member.presence.activities) {
    const customStatus = member.presence.activities.find(
      (act) => act.name === "Custom Status"
    );
    const playing = member.presence.activities.find(
      (act) => act.name === "Playing"
    );
    if (customStatus && playing) {
      status.push(customStatus.state);
      game.push(playing.name);
    } else if (playing && !customStatus) {
      status.push("Playing");
      game.push(playing.name);
    } else if (customStatus && !playing) {
      status.push(customStatus.state);
    } else status.push(member.presence.status);
    if (!status.length) status.push("N/A");
    if (!game?.length) game.push("None");
  }
  let roles = {};
  if (!member) roles = "Not in server";
  else {
    roles.name = "Roles";
    roles.value =
      member.roles.cache.size > 1
        ? member.roles.cache
            .map((role) => {
              if (role.name !== "@everyone") return role.name + ", ";
            })
            .filter((role) => {
              return role !== null;
            })
            .join("")
            .trim()
            .slice(0, -1)
        : "None";
  }
  const response = new EmbedBuilder()
    .setColor(config.messageColors.whois)
    .setTitle(`Whois information for ${user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .addFields([
      { name: "ID", value: user.id, inline: true },
      {
        name: "Nickname",
        value:
          member && member.nickname
            ? member.nickname
            : "None set or not in server",
        inline: true,
      },
      {
        name: "Status",
        value: status.length !== 0 ? status[0] : "None",
        inline: true,
      },
      {
        name: "Game",
        value: game.length !== 0 ? game[0] : "None",
        inline: true,
      },
      {
        name: "Joined",
        value: member ? member.joinedAt.toString() : "Not in server",
        inline: true,
      },
      { name: "Registered", value: user.createdAt.toString(), inline: true },
    ])
    .setTimestamp();
  return interaction.reply({ embeds: [response] });
}
