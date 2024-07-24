// @ts-check
/**
 * Script for deploying commands, so they can be registered to Discord.
 * Commands should only be deployed globally once all testing is completed.
 */
import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import path, { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import config from "./config.js";

const commands = [];
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// All commands should be placed in appropriate directories under the ./commands directory
// const foldersPath = join(__dirname, "commands");
// const commandFolders = readdirSync(foldersPath);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const commandsPath = path.win32.dirname(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith(".js")
);

for (const file of commandFiles) {
  // const commandsPath = pathToFileURL(join(foldersPath, folder)).href;
  // const commandFiles = readdirSync(commandsPath).filter((file) =>
  //   file.endsWith(".js")
  // );
  // for (const file of commandFiles) {
  //   const command = require(`./commands/${folder}/${file}`);
  //   commands.push(command.data.toJSON());
  // }

  const filePath = path.dirname(join(commandsPath, file));
  const { default: command } = await import(filePath);

  commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(config.token);

// Perform the actual deployment
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(config.clientID, config.guildID),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
