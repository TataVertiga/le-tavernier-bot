const { Events } = require('discord.js');

const MESSAGE_ID = '881639401732579349'; // ID du message du règlement
const CHANNEL_ID = '845576163598139402'; // ID du salon du règlement
const ROLE_ID = '872399675091714058'; // ID du rôle "gueux"
const EMOJI_VALIDATION = '✅';
const LOG_CHANNEL_ID = '845582902674980894'; // Salon des logs

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
        const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);

        if (!logChannel) {
          console.warn("⚠️ Salon de log introuvable.");
        } else {
          await logChannel.send(`🧪 ${user.tag} a cliqué sur ✅ dans le règlement.`);
        }

        if (!member.roles.cache.has(ROLE_ID)) {
          await member.roles.add(ROLE_ID);
          if (logChannel) {
            await logChannel.send(`✅ Rôle 'gueux' attribué à ${user.tag}`);
          }
        } else {
          if (logChannel) {
            await logChannel.send(`ℹ️ ${user.tag} avait déjà le rôle 'gueux'`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur dans reglementValidation.js :', error);
      try {
        const guild = reaction.message.guild;
        const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
          await logChannel.send(`❌ Erreur pour ${user.tag} : ${error.message}`);
        }
      } catch (logError) {
        console.error("❌ Impossible d'envoyer l'erreur dans le salon de log :", logError);
      }
    }
  }
};
