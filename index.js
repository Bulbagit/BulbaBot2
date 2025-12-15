// @ts-check
/**
 * BulbaBot entry point
 * @author Justin Folvarcik
 * @version 2.0
 *
 */
import { Client, Collection, GatewayIntentBits } from "discord.js";
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
client.commands = new Collection();

const paths = {
  commands: "./commands",
  events: "./events",
};

const commandFolders = readdirSync(paths.commands);

for (const folder of commandFolders) {
  const commandsPath = join(paths.commands, folder);
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);

    try {
      const commandModule = await import(`file://${path.resolve(filePath)}`);

      const command = commandModule.default || commandModule;

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
