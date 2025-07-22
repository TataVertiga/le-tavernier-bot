const { Events } = require('discord.js');

const ROLE_GUEUX = '872399675091714058'; // ID du rôle "gueux"
const SALON_BIENVENUE = '837135924390264855'; // Salon #accueil

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    try {
      // Vérifie si le rôle "gueux" vient d'être ajouté
      const avaitPasGueux = !oldMember.roles.cache.has(ROLE_GUEUX);
      const aMaintenantGueux = newMember.roles.cache.has(ROLE_GUEUX);

      if (avaitPasGueux && aMaintenantGueux) {
        const channel = newMember.guild.channels.cache.get(SALON_BIENVENUE);
        if (channel) {
          await channel.send(`🍻 Bienvenue <@${newMember.id}> à la Taverne ! Prends un tabouret, y'a de la soupe aux choux.`);
          console.log(`🎉 Message de bienvenue envoyé pour ${newMember.user.tag}`);
        }
      }
    } catch (error) {
      console.error("❌ Erreur dans guildMemberUpdate.js :", error);
    }
  }
};
