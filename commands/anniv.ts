import { Message } from "discord.js";
import dayjs from "dayjs";
import "dayjs/locale/fr.js";
dayjs.locale("fr");

import {
  readBirthdays,
  writeBirthdays,
  setBirthday,
  removeBirthday,
} from "../services/googleSheets.js";

// --- Petites helpers pour le format ---
function validDate(str: string): boolean {
  return /^(\d{2})[-/](\d{2})$/.test(str) || /^(\d{2})[-/](\d{2})[-/](\d{4})$/.test(str);
}
function parseDateParts(str: string): { day: string; month: string; year?: string } | null {
  // Accepte JJ-MM, JJ/MM, JJ-MM-AAAA, JJ/MM/AAAA
  const parts = str.replace(/\//g, "-").split("-");
  if (parts.length === 2) {
    return { day: parts[0], month: parts[1] };
  }
  if (parts.length === 3) {
    return { day: parts[0], month: parts[1], year: parts[2] };
  }
  return null;
}
function formatDateFr(day: string, month: string, year?: string): string {
  return `${day}/${month}${year ? "/" + year : ""}`;
}

export default {
  name: "anniv",
  description: "Gestion des anniversaires dans la Taverne",
  async execute(message: Message, args: string[]): Promise<any> {
    const userId = message.author.id;

    // --- Juste t!anniv
    if (!args.length) {
      const birthdays = await readBirthdays();
      const entry = birthdays[userId];
      let rep = "🎂 **Gestion des anniversaires de la Taverne**\n";
      rep += "• Pour enregistrer : `t!anniv set JJ-MM` ou `t!anniv set JJ-MM-AAAA`\n";
      rep += "• Pour supprimer : `t!anniv remove`\n";
      rep += "• Voir tous : `t!anniv list`\n";
      rep += "💡 Si tu donnes ton année de naissance, ton âge s’affichera dans la liste !\n\n";
      if (entry) {
        let day = "??", month = "??", year = entry.year ? entry.year.toString() : undefined;
        if (entry.date && typeof entry.date === "string") {
          const parts = entry.date.replace(/\//g, "-").split("-");
          [day, month] = parts;
        }
        rep += `> Tu as enregistré : **${formatDateFr(day, month, year)}**\n`;
        if (entry.year && day !== "??" && month !== "??") {
          const age = dayjs().diff(dayjs(`${year}-${month}-${day}`), "year");
          rep += `> Tu as actuellement **${age} ans** (et toutes tes dents ?)\n`;
        }
      } else {
        rep += "> Tu n’as pas encore enregistré ton anniversaire. Fais pas ton timide !\n";
      }
      return message.reply(rep);
    }

    // --- Ajout/modif t!anniv set
    if (args[0] === "set") {
      if (!args[1] || !validDate(args[1])) {
        return message.reply("❌ Format incorrect, gueux ! Utilise `t!anniv set JJ-MM` ou `t!anniv set JJ-MM-AAAA`.\nExemple : `t!anniv set 04-11-1987`");
      }
      const parts = parseDateParts(args[1]);
      if (!parts) {
        return message.reply("❌ Impossible de lire ta date. T’es sûr de toi ?");
      }
      // --- On normalise la date EN TIRET AVANT d’enregistrer ---
      const date = `${parts.day}-${parts.month}`.replace(/\//g, "-");
      const year = parts.year ? parseInt(parts.year) : undefined;

      // Vérifie les bornes
      if (parseInt(parts.day) < 1 || parseInt(parts.day) > 31 || parseInt(parts.month) < 1 || parseInt(parts.month) > 12) {
        return message.reply("❌ C’est pas un vrai jour ou un vrai mois, arrête de picoler !");
      }
      if (year && (year < 1900 || year > dayjs().year())) {
        return message.reply("❌ Tu viens du futur ou tu mens sur ton âge ?");
      }

      await setBirthday(userId, date, year);
      let msg = `✅ Ton anniversaire a bien été enregistré pour le **${formatDateFr(parts.day, parts.month, parts.year)}**.`;
      if (year) {
        const age = dayjs().diff(dayjs(`${year}-${parts.month}-${parts.day}`), "year");
        msg += ` Ça te fait donc **${age} ans**, papuche !`;
      } else {
        msg += " (⚠️ Sans année, pas d’âge affiché dans la liste.)";
      }
      return message.reply(msg);
    }

    // --- Suppression t!anniv remove
    if (args[0] === "remove" || args[0] === "delete") {
      const birthdays = await readBirthdays();
      if (!birthdays[userId]) {
        return message.reply("Tu n’as même pas enregistré d’anniversaire, sombre gueux !");
      }
      await removeBirthday(userId);
      return message.reply("🗑️ Ton anniversaire a été effacé des grimoires de la Taverne !");
    }

    // --- Liste t!anniv list
    if (args[0] === "list") {
      const birthdays = await readBirthdays();
      if (!Object.keys(birthdays).length) {
        return message.reply("Aucun anniversaire d’enregistré chez les gueux !");
      }
      let rep = "🎉 **Anniversaires de la Taverne** :\n";
      for (const [uid, entry] of Object.entries(birthdays)) {
        let displayName = `ID:${uid}`;
        if (message.guild) {
          try {
            const member = await message.guild.members.fetch(uid);
            if (member) displayName = member.displayName || member.user.username;
          } catch (e) {
            // Ignore, fallback sur ID
          }
        }
        // --- On lit en normalisant les dates
        let day = "??", month = "??", year: string | undefined = undefined;
        if (entry.date && typeof entry.date === "string") {
          const parts = entry.date.replace(/\//g, "-").split("-");
          [day, month] = parts;
        }
        if (entry.year && !isNaN(entry.year)) {
          year = entry.year.toString();
        }
        let ligne = `• **${displayName}** : ${formatDateFr(day, month, year)}`;
        if (year && day !== "??" && month !== "??") {
          const birthdate = dayjs(`${year}-${month}-${day}`);
          const age = birthdate.isValid() ? dayjs().diff(birthdate, "year") : null;
          if (age && age > 0 && age < 120) {
            ligne += ` (${age} ans)`;
          }
        }
        rep += ligne + "\n";
      }
      return message.reply(rep);
    }

    // --- Si on comprend rien à la commande
    return message.reply(
      "❌ Je pige rien, gueux ! Utilise :\n" +
      "`t!anniv set JJ-MM` ou `t!anniv set JJ-MM-AAAA` pour enregistrer\n" +
      "`t!anniv remove` pour supprimer\n" +
      "`t!anniv list` pour voir la liste\n"
    );
  },
};
