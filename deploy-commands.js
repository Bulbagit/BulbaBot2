// @ts-check
/**
 * Script for deploying commands to Discord.
 */
import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "./config.js";

const commands = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foldersPath = path.join(__dirname, "commands");
const commandFolders = readdirSync(foldersPath);

console.log(`[INFO] Scanning for commands in: ${foldersPath}`);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    const commandModule = await import(`file://${filePath}`);
    const command = commandModule.default || commandModule;

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
      console.log(`[LOAD] ${command.data.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log(`\nStarted refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(Routes.applicationGuildCommands(config.clientID, config.guildID), {
      body: commands,
    });

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
