// events/guildMemberUpdate.js
module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const roleId = '872399675091714058'; // ID du rôle GUEUX
    const salonId = '837135924390264855'; // ID du salon de bienvenue

    // Si le rôle "GUEUX" vient d’être ajouté
    if (!oldMember.roles.cache.has(roleId) && newMember.roles.cache.has(roleId)) {
      const channel = newMember.guild.channels.cache.get(salonId);
      if (!channel) return;

      channel.send(`🍻 *CLING CLING CLING* ! Fermez vos mouilles, un nouvel éclopé pousse la porte !  
Bienvenue ${newMember} dans la Taverne de Tata Verti, où la bière pique le nez et les bancs tiennent avec de la ficelle !  
T’es désormais un Geux à part entière. Va donc éructer ton histoire dans <#1062355033481240586>  
et colle-toi un titre ronflant dans <#1062360038277392474> — c’est pas qu’on juge, mais un gueux sans blason, c’est comme un pet sans odeur : inutile.

Allez, installe-toi, évite les flaques suspectes, et fais comme chez toi… mais pas trop. ❤️`);
    }
  }
};

