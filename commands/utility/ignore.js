// @ts-check
/**
 * Log a warning for a user.
 */
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import config from "../../config.js";

let choices = [];
for (const property in config.ignores) {
  choices.push({ name: property, value: property });
}

export const data = new SlashCommandBuilder()
  .setName("ignore")
  .setDescription("Allows you to ignore a channel. Use again to stop ignoring the channel.")
  .addStringOption((group) =>
    group
      .setName("group")
      .setDescription("The channel you'd like to ignore (or unignore).")
      .setRequired(true)
  );
export async function execute(interaction) {
  const group = interaction.options.getString("group");
  if (!config.ignores[group])
    return interaction.reply({
      content: `${group} is not a valid channel to ignore.`,
      flags: MessageFlags.Ephemeral,
    });
  const user = interaction.member;
  if (!user.roles.cache.has(config.ignores[group])) return addIgnore(user, group, interaction);
  else return this.removeIgnore(user, group, interaction);
}
export function addIgnore(user, group, interaction) {
  user.roles
    .add(config.ignores[group])
    .then(() => {
      return interaction.reply({
        content: `You are now ignoring ${group}`,
        flags: MessageFlags.Ephemeral,
      });
    })
    .catch((err) => {
      console.log(err);
      interaction.reply({
        content: "Oops! Something went wrong. Please let a moderator know so we can fix this!",
        flags: MessageFlags.Ephemeral,
      });
    });
}
export function removeIgnore(user, group, interaction) {
  user.roles
    .remove(config.ignores[group])
    .then(() => {
      return interaction.reply({
        content: `You are no longer ignoring ${group}.`,
        flags: MessageFlags.Ephemeral,
      });
    })
    .catch((err) => {
      console.log(err);
      interaction.reply({
        content: "Oops! Something went wrong. Please let a moderator know so we can fix this!",
        flags: MessageFlags.Ephemeral,
      });
    });
}
