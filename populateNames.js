// Migration that will populate the names into the ModLogs table
import { guildID, token } from "config.js";
import { Client, GatewayIntentBits } from "discord.js";
import { findAll } from "includes/sqlModLogs.js";
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

const warnings = await findAll();

warnings.forEach(async (warning) => {
  const userID = warning.getDataValue("loggedID").toString();
  const guild = await client.guilds.fetch(guildID);
  const member = await guild.members.fetch(userID);
  const user = await client.users.fetch(userID);
  let nick = "";
  if (!member) nick = user.username;
  else nick = member.nickname;
  const username = user.username;
  warning
    .update({ loggedNick: nick, loggedUsername: username })
    .then(() => {
      console.log(
        `Updated: ${warning.getDataValue("id")}\nNick: ${nick}\n` + `Username: ${username}`
      );
    })
    .catch((err) => {
      console.log(err);
    });
});

client.login(token);
