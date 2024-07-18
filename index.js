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
import { fileURLToPath, pathToFileURL } from "node:url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

client.commands = new Collection();
const foldersPath = join(__dirname, "commands");
const commandFolders = readdirSync(foldersPath);

async function loadCommands() {
  for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter((file) =>
      file.endsWith(".js")
    );

    for (const file of commandFiles) {
      let filePath = pathToFileURL(join(commandsPath, file)).href;

      try {
        const command = await import(filePath);

        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.log(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
          );
        }
      } catch (err) {
        console.error(
          "Error when loading command at",
          filePath,
          " - error:",
          err
        );
      }
    }
  }
}

loadCommands().catch(console.error);

// Register event handlers
const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((file) =>
  file.endsWith(".js")
);

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);

  import(filePath).then((event) => {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  });
}

client.login(config.token);
