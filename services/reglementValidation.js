const { Events } = require('discord.js');

const MESSAGE_ID = '881639401732579349'; // Message du règlement
const CHANNEL_ID = '845576163598139402'; // Salon du règlement
const ROLE_ID = '872399675091714058'; // Rôle "gueux"
const EMOJI_VALIDATION = '✅';

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
      if (user.bot) return;

      if (
        reaction.message.id === MESSAGE_ID &&
        reaction.message.channel.id === CHANNEL_ID &&
        reaction.emoji.name === EMOJI_VALIDATION
      ) {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        if (!member.roles.cache.has(ROLE_ID)) {
          await member.roles.add(ROLE_ID);
          console.log(`🎖️ Rôle 'gueux' attribué à ${user.tag}`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur dans reglementValidation.js :', error);
    }
  }
};
