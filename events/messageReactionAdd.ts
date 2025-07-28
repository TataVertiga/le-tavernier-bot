import {
  Events,
  MessageReaction,
  User,
  TextChannel
} from 'discord.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction: MessageReaction, user: User) {
    if (user.bot) return;

    const messageIdReglement = '881639401732579349';
    const roleIdGeux = '872399675091714058';
    const channelId = '837135924390264855';
    const histoireChannelId = '871362324668227624';
    const titresChannelId = '845580188339404800';

    if (reaction.message.id !== messageIdReglement) return;
    if (reaction.emoji.name !== '✅') return;

    const guild = reaction.message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id);
    if (member.roles.cache.has(roleIdGeux)) return;

    try {
      await member.roles.add(roleIdGeux);
    } catch (err) {
      console.error('Erreur lors de l’attribution du rôle :', err);
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !(channel instanceof TextChannel)) return;

    channel.send(`🍻 CLING CLING CLING ! Fermez vos mouilles, un nouvel éclopé pousse la porte !
Bienvenue ${member} dans la Taverne de Tata Verti, où la bière pique le nez et les bancs tiennent avec de la ficelle !
T’es désormais un Geux à part entière. Va donc éructer ton histoire dans <#${histoireChannelId}>
et colle-toi un titre ronflant dans <#${titresChannelId}> — c’est pas qu’on juge, mais un gueux sans blason, c’est comme un pet sans odeur : inutile.

Allez, installe-toi, évite les flaques suspectes, et fais comme chez toi… mais pas trop. ❤️`);
  }
};
