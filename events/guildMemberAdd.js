// events/guildMemberAdd.js
const WELCOME_CHANNEL_ID = "837135924390264855";

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      if (member.guild.id !== "837135924390264852") return;

      const channel = await member.client.channels.fetch(WELCOME_CHANNEL_ID);
      if (!channel) return;

      await channel.send(`🍻 Bienvenue <@${member.id}> à La Taverne de Tata ! Passe le seuil, lis le règlement, prends ton rôle, et si t'es pas sage... une cla-claque et ça dégage !`);
    } catch (error) {
      console.error("Erreur dans le message de bienvenue :", error.message);
    }
  },
};