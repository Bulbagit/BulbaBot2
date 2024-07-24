// @ts-check
/**
 * BulbaBot entry point
 * @author Justin Folvarcik
 * @version 2.0
 *
 */
import { Client, GatewayIntentBits } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import path from "path";
import config from "./config.js";

// Register commands
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const paths = {
  commands: "./commands",
  events: "./events",
};

const commands = readdirSync(paths.commands).filter((file) =>
  file.endsWith(".js")
);

for (const command of commands) {
  const filePath = path.dirname(join(paths.commands, command));

  try {
    const { default: command } = await import(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  } catch (err) {
    console.error("Error when loading command at", filePath, " - error:", err);
  }
}

// Register event handlers
const events = readdirSync(paths.events).filter((file) => file.endsWith(".js"));

for (const event of events) {
  const filePath = await import(`./events/${event}`);

  if (filePath.once) {
    client.once(filePath.name, (...args) => filePath.execute(...args));
  } else {
    client.on(filePath.name, (...args) => filePath.execute(...args));
  }
}

client.login(config.token);
