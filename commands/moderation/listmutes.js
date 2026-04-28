// @ts-check
/*
 * List active mutes in the database.
 */

import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";
import { Mutes } from "../../includes/index.js";

export const data = new SlashCommandBuilder()
  .setName("listmutes")
  .setDescription("Get a list of current mutes that are stored in the database.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
export async function execute(interaction) {
  let mutes;
  try {
    mutes = await Mutes.findAll();
  } catch (err) {
    console.log(err);
    return interaction.reply({
      content:
        "Something went wrong while attempting to retrieve current mutes. Please inform the bot's administrator.",
      flags: MessageFlags.Ephemeral,
    });
  }
  if (mutes.length === 0) return interaction.reply("There are no active mutes at this time.");
  let fields = [];
  for (const mute of mutes) {
    fields.push({
      name: `ID#${mute.getDataValue("id").toString()}`,
      value:
        `User ID: ${mute.getDataValue("mutedID")}\n` +
        `Username: ${mute.getDataValue("mutedName")}\n` +
        `Duration: ${mute.getDataValue("duration")}\n` +
        `Mute time: ${mute.getDataValue("mutedTime")}\n` +
        `Unmute time: ${mute.getDataValue("unmutedTime")}`,
      inline: true,
    });
  }
  const response = new EmbedBuilder()
    .setColor(config.messageColors.whois)
    .setTitle("Active Mutes")
    .setDescription("The following mutes are currently listed as active in the database.")
    .addFields(fields)
    .setTimestamp();
  return interaction.reply({ embeds: [response] });
}
