module.exports = {
  name: 'guildMemberAdd',
  execute: async (member) => {
    const channel = member.guild.channels.cache.get("837135924390264855");
    if (!channel) return;

    channel.send(`🍺 **Bienvenue à la taverne, ${member}!**  
Approche donc, pose ton fessier là où c’est encore tiède et présente-toi aux autres gueux. Le premier qui paie sa tournée est rarement le dernier à se faire des copains. Santé !`);
  }
};
