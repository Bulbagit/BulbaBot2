/**
 * This handler fires whenever any message is sent.
 * It is used to check message contents, as well as enforce filters.
 */
const {Events, EmbedBuilder} = require('discord.js');
const {guildID, logChannel, messageColors, noInvites, modID} = require('../config.json');
const Blacklist = require("../includes/sqlBlacklist.js");
const ModLogs = require("../includes/sqlModLogs.js");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const needle = require('needle');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        if (message.guild.id !== guildID || !message.member) return;

        // Define wiki sources
        const wikiSources = {
            'animalcrossing': 'https://nookipedia.com/w/api.php',
            'arms': 'https://armswiki.org/w/api.php',
            'bulbapedia': 'https://bulbapedia.bulbagarden.net/w/api.php',
            'chibirobo': 'https://chibi-robo.wiki/w/api.php',
            'dragalialost': 'https://dragalialost.wiki/w/api.php',
            'drawntolife': 'https://drawntolife.wiki/w/api.php',
            'wikibound': 'https://wikibound.info/w/api.php',
            'fireemblem': 'https://fireemblemwiki.org/w/api.php',
            'mutecity': 'https://mutecity.org/w/api.php',
            'goldensun': 'https://goldensunwiki.net/w/api.php',
            'kidicarus': 'https://www.kidicaruswiki.org/w/api.php',
            'wikirby': 'https://wikirby.com/w/api.php',
            'kingdomhearts': 'https://www.khwiki.com/w/api.php',
            'kovopedia': 'https://kovopedia.com/w/api.php',
            'mario': 'https://www.mariowiki.com/w/api.php',
            'metroid': 'https://www.metroidwiki.org/w/api.php',
            'mii': 'https://miiwiki.org/w/api.php',
            'mysterydungeon': 'https://mysterydungeonwiki.com/w/api.php',
            'niwa': 'https://niwanetwork.org/w/api.php',
            'pikmin': 'https://www.pikminwiki.com/w/api.php',
            'pikminfanon': 'https://pikminfanon.com/w/api.php',
            'rhythmheaven': 'https://rhwiki.net/w/api.php',
            'smash': 'https://www.ssbwiki.com/w/api.php',
            'starfox': 'https://starfoxwiki.info/w/api.php',
            'starfy': 'https://www.starfywiki.org/w/api.php',
            'splatoon': 'https://splatoonwiki.org/w/api.php',
            'strategy': 'https://strategywiki.org/w/api.php',
            'harddrop': 'https://harddrop.com/w/api.php',
            'ukikipedia': 'https://ukikipedia.net/w/api.php',
            'wars': 'https://warswiki.org/w/api.php',
            'xeno': 'https://www.xenoserieswiki.org/w/api.php',
            'zelda': 'https://zeldawiki.wiki/w/api.php'
        };

        // Regex to match [[term]] or [[prefix:term]]
        const linkRegex = /\[\[(?:([a-z]+):)?(.+?)\]\]/i;

        // Match the message against the regex
        const match = message.content.match(linkRegex);
        if (!match) return; // If no match, exit early

        const prefix = match[1]?.toLowerCase() || 'bulbapedia'; // Default to Bulbapedia if no prefix
        const searchText = match[2]?.trim(); // Extract the search term

        if (!searchText) {
            return message.reply({
                content: "Please provide a search term, e.g., `[[term]]` or `[[prefix:term]]`.",
                allowedMentions: { repliedUser: false }
            });
        }

        const apiUrl = wikiSources[prefix];
        if (!apiUrl) {
            return message.reply({
                content: `Unknown wiki prefix: "${prefix}". Supported prefixes are: ${Object.keys(wikiSources).join(', ')}`,
                allowedMentions: { repliedUser: false }
            });
        }

        try {
            // Perform a search query to find the term
            const searchUrl = `${apiUrl}?action=query&list=search&srsearch=${encodeURIComponent(searchText)}&format=json`;
            const response = await needle('get', searchUrl);

            if (response.statusCode === 200) {
                const searchResults = response.body?.query?.search;

                if (searchResults && searchResults.length > 0) {
                    const exactMatch = searchResults.find(
                        (result) => result.title.toLowerCase() === searchText.toLowerCase()
                    );
                    const matchedResult = exactMatch || searchResults[0];
                    const pageTitle = encodeURIComponent(matchedResult.title.replace(/ /g, '_'));
                    await message.reply({
                        content: `${apiUrl.replace('/w/api.php', '')}/wiki/${pageTitle}`,
                        allowedMentions: { repliedUser: false }
                    });
                } else {
                    await message.reply({
                        content: `No results found for "${searchText}" on ${prefix} wiki.`,
                        allowedMentions: { repliedUser: false }
                    });
                }
            } else {
                console.error(`Search API error: ${response.statusCode}`);
                await message.reply({
                    content: `Could not fetch results for "${searchText}" from ${prefix} wiki.`,
                    allowedMentions: { repliedUser: false }
                });
            }
        } catch (error) {
            console.error('Error fetching data from the wiki API:', error);
            await message.reply({
                content: `An error occurred while fetching data from ${prefix} wiki.`,
                allowedMentions: { repliedUser: false }
            });
        }

        //Disable invites
        const logsChannel = message.guild.channels.resolve(logChannel)
        const modRole = await message.guild.roles.fetch(modID);
        // Mods and up are exempt from this restriction
        const member = await message.guild.members.fetch(message.author);
        if (noInvites && message.content.toLowerCase().includes("discord.gg") && member.roles.highest.position < modRole.position) {
            try {
                await message.delete();
            } catch (err) {
                console.log(err);
                const response = new EmbedBuilder()
                    .setColor(messageColors.error)
                    .setTitle("Failed to delete Discord link")
                    .setDescription(`I was unable to remove message ${message.url}, in which I detected a Discord Link.`)
                    .addFields([
                        {
                            name: "Message",
                            value: message.content
                        },
                        {
                            name: "User",
                            value: message.author
                        }
                    ])
                    .setTimestamp();
                return logsChannel.send({embeds: [response]});
            }
            const response = new EmbedBuilder()
                .setColor(messageColors.messageDelete)
                .setTitle("Discord link removed")
                .setDescription("Message with Discord invite link removed.")
                .addFields([
                    {
                        name: "Message",
                        value: message.content.toString()
                    },
                    {
                        name: "User",
                        value: message.author.toString()
                    }])
                .setTimestamp();
            return logsChannel.send({embeds: [response]});

        }
        return this.filterMessage(message);
        
    },

    async filterMessage(message) {
        const filters = await Blacklist.findAll();
        if (!filters) return false; // No filters in place
        let actions = [];
        filters.forEach(filter => {
            let text = message.content;
            let flags = filter.getDataValue("flags");
            if (flags)
                flags = flags.split(","); // ["a", "s", "d", ...]
            let options = filter.getDataValue("options");
            if (options)
                options = options.split(",");// ["minimumaccountage:3d", "warntime:5d", ...]
            let term = filter.getDataValue("term");
            if (flags.indexOf("n") !== -1) {
                // Remove the flag from the list so we can iterate over actions later
                flags.splice(flags.indexOf("n"), 1);
                const accountAge = message.author.createdAt;
                const serverTime = message.member.joinedAt;
                if (!typeof(options.filter) !== "function")
                    return;
                let minimumAccountAge = options.filter(option => option.startsWith("minimumaccountage"));
                if (minimumAccountAge.length) {
                    const time = minimumAccountAge[0].split(":");
                    const duration = this.getDuration(time[1])[0];
                    if (Date.now() - accountAge < Date.now() - duration)
                        return; // Account is older than set age; Ignore this filter
                }
                let minimumServerTime = options.filter(option => option.startsWith("minimumservertime"));
                if (minimumServerTime.length) {
                    const time = minimumServerTime[0].split(":");
                    const duration = this.getDuration(time[1])[0];
                    if (Date.now() - serverTime < Date.now() - duration)
                        return; // Account has been in server long enough; Ignore filter
                }
            }
            if (flags.indexOf("i") === -1) { // Case insensitive by default
                flags.splice(flags.indexOf("i"), 1);
                term = term.toLowerCase();
                text = text.toLowerCase();
            }
            if (text.includes(term)) {
                let banned = false;
                let kicked = false;
                let warned = false;
                const filterID = filter.getDataValue("id");
                Array.from(flags).forEach(async flag => {
                    switch (flag) {
                        case "b":
                            actions.push("User was banned.");
                            banned = true;
                            await message.author.send({content: `You have been automatically banned from ${message.guild.name} for your message in ${message.channel.name}, which is as follows:\n` +
                            `${message.content}\nIf you believe you have been falsely banned, you may contact the moderators to request manual review. Please be aware that harassment directed toward` +
                            ` the moderation team may result in referral to Discord staff.\nPlease do not reply directly to this message; you will not receive a response.`});
                            message.guild.members.ban(message.author, {reason: "Banned automatically due to filter settings"}).then(() => {
                            }).catch(err => {
                                console.log(err);
                            });
                            break;
                        case "k":
                            kicked = true;
                            actions.push("User was kicked.");
                            await message.author.send({content: `You have been automatically kicked from ${message.guild.name} for your message in ${message.channel.name}, which is as follows:\n` +
                                    `${message.content}\nYou may rejoin the server, but you are encouraged to read the rules to prevent further action against your account.` +
                                `\nIf you believe this was done in error, you may contact the moderators to request manual review. Please be aware that harassment directed toward` +
                                    ` the moderation team may result in referral to Discord staff.\nPlease do not reply directly to this message; you will not receive a response.`});
                            message.guild.members.kick(message.author, "Kicked automatically due to filter settings").then(() => {
                            }).catch(err => {
                                console.log(err);
                            });
                            break;
                        case "w":
                            actions.push("Warning logged for user.")
                            warned = true;
                            flags.splice(flags.indexOf("w"), 1); // Remove from the list so softban knows what to do
                            await ModLogs.create({
                                loggedID: message.author.id,
                                loggerID: message.client.user.id,
                                logName: "filter" + filterID,
                                message: "Warning logged automatically via filter #" + filterID
                            }).then(async () => {
                                if (!banned && !kicked)
                                await message.author.send(`Your message in the server ${message.guild.name}, in the channel ${message.channel.name}, was flagged by our system as being inappropriate.` +
                                ` The message is as follows:\n${message.content}\n` +
                                `Please take the time to review the server rules to prevent further action being taken against your account.\n` +
                                `If you believe this was done in error, please contact the moderators for a manual review. Please be aware that harassment directed toward` +
                                    ` the moderation team may result in referral to Discord staff.\nPlease do not reply directly to this message; you will not receive a response.`);
                            }).catch(err => {
                                console.log(err);
                            });
                            break;
                        case "d":
                            actions.push("Message was deleted.");
                            message.delete().then(() => {
                                if (!banned && !warned && !kicked)
                                    message.author.send({content: `Your message in the server ${message.guild.name}, in the channel ${message.channel.name} has been identified as violating server rules and` +
                                            ` automatically deleted. The message was as follows:\n`
                                            + `${message.content}\nPlease review the server rules to prevent further action against your account.`});
                            }).catch(err => {
                                console.log(err);
                            });
                            break;
                        case "s":
                            let time = options.filter(option => option.startsWith("warntime"))[0].split(":")[1];
                            let interval = this.getDuration(time)[1];
                            const warnings = await ModLogs.count({
                                where: {
                                    loggerID: message.client.user.id,
                                    logTime: {[Op.gte]: Sequelize.literal("DATE_SUB(NOW(), " + interval + ")")},
                                    logName: "filter" + filterID
                                }
                            });
                            let threshold = 0;
                            if (flags.indexOf("w") !== -1)
                                threshold += 1;
                            threshold += parseInt(options.filter(option => option.startsWith("warnlimit"))[0].split(":")[1], 10);
                            if (warnings === threshold) {
                                actions.push("User was automatically banned due to an accumulation of warnings.")
                                await message.author.send({content: `You have been automatically banned from ${message.guild.name} for your message in ${message.channel.name}, which is as follows:\n` +
                                        `${message.content}\nThis is not the first recorded instance of you violating a specific rule, and our system has therefore banned you automatically.\n`
                                    + `If you believe you have been falsely banned, you may contact the moderators to request manual review. Please be aware that harassment directed toward` +
                                        ` the moderation team may result in referral to Discord staff.\nPlease do not reply directly to this message; you will not receive a response.`});
                                await message.guild.members.ban(message.author, {
                                    reason: "Banned automatically" +
                                        " due to an accumulation of automated warnings."
                                }).then(() => {
                                    banned = true;
                                }).catch(err => {
                                    console.log(err);
                                });
                            }
                            break;
                    }
                });
                const responseFields = [{
                    name: "Message",
                    value: message.content,
                },
                    {name: "The following actions have been taken:",
                    value: actions.join("\n") ? actions.join("\n") : "None"}]
                const response = new EmbedBuilder()
                    .setColor(messageColors.filter)
                    .setTitle(`Filter ID ${filterID} tripped`)
                    .setDescription(`User ${message.author.username} triggered filter #${filterID}`)
                    .addFields(responseFields)
                    .setTimestamp();
                const logsChannel = message.guild.channels.resolve(logChannel);
                logsChannel.send({embeds: [response]});
            }


        });
    },

    getDuration(arg) {
        const measure = arg.trim().toLowerCase().slice(-1);
        const time = parseInt(arg.trim().toLowerCase().slice(0, 1), 10);
        let duration = 1;
        let interval = "INTERVAL " + time.toString();
        switch (measure) {
            case ("d"):
                interval += " DAY";
                duration = time * 24 * 60 * 60; // d*h*m*s
                break;
            case ("h"):
                interval += " HOUR";
                duration = time * 60 * 60;  // h*m*s
                break;
            case ("m"):
                interval += " MINUTE";
                duration = time * 60; // m*s
                break;
            case ("s"): // Do nothing
                interval += " SECOND";
                duration = time;
                break;
            default:
                return false; // Don't recognize the format
        }
        return [duration * 1000, interval];
        }
}
