// @ts-check
/*
 * Unmute a user.
 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Sequelize from "sequelize";
import config from "../../config.js";
import { Mutes } from "../../includes/index.js";

const sequelize = new Sequelize(config.database, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "mysql",
  logging: false,
});

export const data = new SlashCommandBuilder()
  .setName("unmute")
  .setDescription("Manually remove a mute from a user.")
  .addUserOption((user) =>
    user.setName("user").setDescription("The muted user.").setRequired(true)
  )
  .addStringOption((reason) =>
    reason
      .setName("reason")
      .setDescription("Reason for removing the mute.")
      .setRequired(true)
  );
export async function execute(interaction) {
  const modRole = await interaction.guild.roles.fetch(config.modID);
  const logsChannel = await interaction.guild.channels.fetch(config.logChannel);
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");
  // Not a mod; cannot use this command
  if (interaction.member.roles.highest.position < modRole.position) {
    interaction.client.emit(
      "unauthorized",
      interaction.client,
      interaction.user,
      {
        command: "unmute",
        details: `${interaction.user.username} attempted to unmute user #${user.username} with reason ${reason}`,
      }
    );
    return interaction.reply(
      "You are not authorized to perform this command. Repeated attempts to perform unauthorized actions may result in a ban."
    );
  }
  const member = await interaction.guild.members.fetch(user);
  if (!member.roles.cache.has(config.muteID))
    return interaction.reply("This user is not currently muted.");
  member.roles
    .remove(config.muteID)
    .then(() => {
      Mutes.destroy({ where: { mutedID: user.id } })
        .then(() => {
          const response = new EmbedBuilder()
            .setColor(config.messageColors.memUnmute)
            .setTitle("User unmuted")
            .setDescription(
              `User ${user.username} was manually unmuted by ${interaction.user.username}.`
            )
            .setTimestamp();
          logsChannel.send({ embeds: [response] });
          return interaction.reply({ embeds: [response] });
        })
        .catch((err) => {
          console.log(err);
          const response = new EmbedBuilder()
            .setColor(config.messageColors.memUnmute)
            .setTitle("User unmuted")
            .setDescription(
              `User ${user.username} was manually unmuted by ${interaction.user.username}.`
            )
            .setTimestamp();
          interaction.channel.send({
            content:
              `The "muted" role has been removed, but there was a problem removing the mute from the database.` +
              ` Please inform the bot's administrator.`,
            embeds: [response],
          });
        });
      user
        .send({
          content: `You have been manually unmuted in ${interaction.guild.name} by a moderator.`,
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
      return interaction.reply(
        "There was an error removing the muted role. Please inform the bot's administrator."
      );
    });
}
