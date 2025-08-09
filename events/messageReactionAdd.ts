import { Events, MessageReaction, User, GuildMember } from "discord.js";

const RULE_MESSAGE_ID = "881639401732579349"; // ID du message de règlement
const GUEUX_ROLE_ID   = "872399675091714058"; // rôle GUEUX

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction: MessageReaction, user: User) {
    if (user.bot) return;

    try {
      if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
      if ((reaction.message as any).partial) { try { await reaction.message.fetch(); } catch { return; } }

      const isRightMessage = reaction.message.id === RULE_MESSAGE_ID;
      const isCheckEmoji = reaction.emoji.name === "✅"; // emoji natif
      if (!isRightMessage || !isCheckEmoji) return;

      // 🧾 LOG: réaction sur le règlement
      console.log("[ DISCORD ] reaction ✅ sur règlement par", user.tag);

      const guild = reaction.message.guild;
      if (!guild) return;

      const member: GuildMember = await guild.members.fetch(user.id);
      if (!member || member.roles.cache.has(GUEUX_ROLE_ID)) return;

      await member.roles.add(GUEUX_ROLE_ID);
      // Pas de message ici : il partira via GuildMemberUpdate.ts
    } catch (err) {
      console.error("[ DISCORD ] Erreur attribution rôle GUEUX :", err);
    }
  },
};
