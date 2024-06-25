/**
 * Event handler for logging deleted messages.
 */
const {Events, EmbedBuilder} = require('discord.js');
const {logChannel, guildID, messageColors} = require('../config.json');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(member, newmember) {
        const logsChannel = await member.guild.channels.fetch(logChannel);

        let displaymsg = "";

        if (member.nickname == null) {
            displaymsg = "Member nickname updated to " + newmember.nickname;
        }
        else if (newmember.nickname == null) {
            displaymsg = "Member nickname removed (was " + member.nickname + ")";
        }
        else {
            displaymsg = "Member nickname updated from " + member.nickname + " to " + newmember.nickname;
        }

        if (member.nickname != newmember.nickname) {
            const response = new EmbedBuilder()
                .setColor(messageColors.memJoin)
                .setTitle(`Member Updated`)
                .setThumbnail(member.user.displayAvatarURL())
                .setDescription(displaymsg)
                .setFooter({text: `ID: ${member.id}`})
                .addFields([{name: 'User', value: `${member.user.username}`}])
                .setTimestamp();
            return logsChannel.send({embeds: [response]}).catch(err => console.log(err));
        }
    }
}