import { Events, GuildMember, TextChannel } from "discord.js";

const GUEUX_ROLE_ID = "872399675091714058";          // rôle GUEUX
const WELCOME_CHANNEL_ID = "837135924390264855";      // salon d'accueil
const PRESENTATION_CHANNEL_ID = "871362324668227624"; // présentation
const ROLES_CHANNEL_ID = "845580188339404800";        // prise de rôles

// Anti-doublon soft
const greetedRecently = new Set<string>();

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember) {
    try {
      const avaitPas = !oldMember.roles.cache.has(GUEUX_ROLE_ID);
      const aMaintenant = newMember.roles.cache.has(GUEUX_ROLE_ID);
      if (!(avaitPas && aMaintenant)) return;

      if (greetedRecently.has(newMember.id)) return;
      greetedRecently.add(newMember.id);
      setTimeout(() => greetedRecently.delete(newMember.id), 5 * 60 * 1000);

      // 🧾 LOG: on a détecté l'ajout du rôle, on va envoyer le message
      console.log("[ DISCORD ] rôle GUEUX ajouté → message envoyé à", newMember.user.tag);

      const ch = newMember.guild.channels.cache.get(WELCOME_CHANNEL_ID);
      if (!ch || !(ch instanceof TextChannel)) return;

      await ch.send(
        `🍻 **CLING CLING CLING !** Fermez vos mouilles, un nouvel éclopé pousse la porte !\n` +
        `Bienvenue ${newMember} dans la **Taverne de Tata Verti** où la bière pique le nez et les bancs tiennent avec de la ficelle.\n` +
        `T’es désormais un **Gueux** à part entière. Va donc éructer ton histoire dans <#${PRESENTATION_CHANNEL_ID}> ` +
        `et va t’équiper d’un titre ronflant ou de pouvoirs obscurs dans <#${ROLES_CHANNEL_ID}> — un gueux sans blason, c’est comme un pet sans odeur : **inutile**.\n\n` +
        `Allez, installe-toi, évite les flaques suspectes, et fais comme chez toi… mais pas trop. ❤️`
      );
    } catch (e) {
      console.error("[WELCOME] Erreur GuildMemberUpdate :", e);
    }
  },
};
