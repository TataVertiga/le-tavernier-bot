import fs from "fs";
import path from "path";
import cron from "node-cron";
import { Client, TextChannel } from "discord.js";

const dataPath = path.join(process.cwd(), "data");
const birthdaysFile = path.join(dataPath, "birthdays.json");
const lastBirthdayFile = path.join(dataPath, "lastBirthday.json");

// --- Lecture sécurisée ---
function loadBirthdays(): Record<string, { date: string; year?: number }> {
  try {
    if (!fs.existsSync(birthdaysFile)) return {};
    const content = fs.readFileSync(birthdaysFile, "utf8").trim();
    if (!content) return {};
    return JSON.parse(content);
  } catch {
    console.warn("[ANNIV] ⚠️ Erreur lecture birthdays.json → retour vide");
    return {};
  }
}

function loadLastBirthday(): Record<string, string> {
  try {
    if (!fs.existsSync(lastBirthdayFile)) return {};
    const content = fs.readFileSync(lastBirthdayFile, "utf8").trim();
    if (!content) return {};
    return JSON.parse(content);
  } catch {
    console.warn("[ANNIV] ⚠️ Erreur lecture lastBirthday.json → retour vide");
    return {};
  }
}

function saveLastBirthday(data: Record<string, string>) {
  try {
    fs.writeFileSync(lastBirthdayFile, JSON.stringify(data, null, 0), "utf8");
  } catch (err) {
    console.error("[ANNIV] ❌ Impossible d'écrire lastBirthday.json :", err);
  }
}

// --- Lancement check anniversaire ---
export function initAnniversaires(client: Client) {
  console.log("[ANNIV] Système d'anniversaires chargé 🍰");

  cron.schedule("0 0 * * *", () => {
    console.log("[ANNIV] Minuit pétante → vérification des anniversaires…");

    const birthdays = loadBirthdays();
    const lastBirthday = loadLastBirthday();
    const today = new Date();
    const todayKey = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const channel = client.channels.cache.get("837135924390264855") as TextChannel;
    if (!channel) return console.warn("[ANNIV] ⚠️ Salon introuvable.");

    for (const [userId, data] of Object.entries(birthdays)) {
      if (data.date === todayKey) {
        // Anti doublon
        if (lastBirthday[userId] === todayKey) continue;

        // Calcul âge si année dispo
        let message;
        if (data.year) {
          const age = today.getFullYear() - data.year;
          const phrases = [
            `🍺 Bon anniversaire, @${userId} ! ${age} ans... t'approches dangereusement de la bière sans mousse.`,
            `🎂 ${age} ans aujourd'hui @${userId} ! Va falloir souffler les bougies... sans cracher dedans.`,
            `⚔️ ${age} hivers au compteur, @${userId}... et toujours pas foutu de payer ta tournée.`,
            `🍷 Joyeux anniversaire @${userId} ! ${age} ans et toujours aussi sobre... enfin presque.`,
            `🪓 ${age} ans, @${userId} ! À cet âge-là, certains arrêtent de boire... mais pas toi.`
          ];
          message = phrases[Math.floor(Math.random() * phrases.length)];
        } else {
          const phrases = [
            `🍺 Bon anniversaire @${userId} ! Et l'âge ? Ah oui... c'est classé secret taverne.`,
            `🎂 Joyeux anniversaire @${userId} ! Je dirai pas ton âge... mais tu le sens dans tes genoux.`,
            `⚔️ Un an de plus, @${userId} ! On t'apportera pas de gâteau, juste une pinte.`,
            `🍷 Santé @${userId} ! Même si on sait pas quel âge tu as...`,
            `🪓 Bon anniversaire @${userId} ! Un an de plus dans le bide.`
          ];
          message = phrases[Math.floor(Math.random() * phrases.length)];
        }

        console.log(`[DISCORD] Envoi message anniversaire pour ${userId}`);
        channel.send(message);

        // Enregistre pour éviter de le refaire dans la journée
        lastBirthday[userId] = todayKey;
      }
    }

    saveLastBirthday(lastBirthday);
  });
}
