import { Message } from "discord.js";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data");
const birthdaysFile = path.join(dataPath, "birthdays.json");

function loadBirthdays(): Record<string, { date: string; year?: number }> {
  try {
    if (!fs.existsSync(birthdaysFile)) return {};
    const content = fs.readFileSync(birthdaysFile, "utf8").trim();
    if (!content) return {}; // fichier vide
    return JSON.parse(content);
  } catch {
    console.warn("[ANNIV] ⚠️ Erreur lecture birthdays.json → retour vide");
    return {};
  }
}

function saveBirthdays(data: Record<string, { date: string; year?: number }>) {
  try {
    fs.writeFileSync(birthdaysFile, JSON.stringify(data, null, 0), "utf8");
  } catch (err) {
    console.error("[ANNIV] ❌ Impossible d'écrire birthdays.json :", err);
  }
}

export default {
  name: "anniv",
  description: "Gérer ton anniversaire",
  async execute(message: Message, args: string[]) {
    const userId = message.author.id;
    const birthdays = loadBirthdays();

    if (!args.length) {
      return message.reply("⚠️ Utilise `t!anniv set JJ-MM` ou `t!anniv set JJ-MM-AAAA`, `t!anniv list`, `t!anniv remove`.");
    }

    const sub = args[0].toLowerCase();

    // --- SET ---
    if (sub === "set") {
      if (!args[1]) {
        return message.reply("⚠️ Format attendu : `t!anniv set JJ-MM` ou `t!anniv set JJ-MM-AAAA`");
      }

      const parts = args[1].split("-");
      if (parts.length < 2 || parts.length > 3) {
        return message.reply("⚠️ Format incorrect. Utilise `JJ-MM` ou `JJ-MM-AAAA`.");
      }

      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts.length === 3 ? parseInt(parts[2]) : undefined;

      birthdays[userId] = { date: `${month}-${day}`, ...(year ? { year } : {}) };
      saveBirthdays(birthdays);

      return message.reply(`✅ Ton anniversaire est enregistré pour le **${day}/${month}**${year ? ` (${year})` : ""} !`);
    }

    // --- REMOVE ---
    if (sub === "remove") {
      if (!birthdays[userId]) return message.reply("⚠️ Tu n'avais pas d'anniversaire enregistré.");
      delete birthdays[userId];
      saveBirthdays(birthdays);
      return message.reply("🗑️ Ton anniversaire a été supprimé !");
    }

    // --- LIST ---
    if (sub === "list") {
      if (!Object.keys(birthdays).length) return message.reply("📜 Aucun anniversaire enregistré.");
      const list = Object.entries(birthdays)
        .map(([id, data]) => `<@${id}> → ${data.date}${data.year ? ` (${data.year})` : ""}`)
        .join("\n");
      return message.reply(`📅 **Anniversaires enregistrés :**\n${list}`);
    }
  }
};
