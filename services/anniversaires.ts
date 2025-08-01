import { Client, TextChannel } from "discord.js";
import { google } from "googleapis";
import dayjs from "dayjs";
import "dayjs/locale/fr.js";
dayjs.locale("fr");

import dotenv from "dotenv";
dotenv.config();

// --- CONFIG ---
const ANNIV_CHANNEL_ID = process.env.ANNIV_CHANNEL_ID || ""; // ID salon Discord
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

// --- Cache pour éviter le spam ---
let anniversairesSouhaitesAujourdHui: Set<string> = new Set();

// --- Lecture Google Sheets ---
async function getAnniversaires(): Promise<{ nom: string; date: string }[]> {
  try {
    console.log("[ANNIV] Lecture des données Google Sheets…");
    const sheets = google.sheets({ version: "v4", auth: GOOGLE_API_KEY });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Anniversaires!A2:B", // Feuille + plage à ajuster
    });

    const rows = res.data.values || [];
    console.log(`[ANNIV] ${rows.length} anniversaires trouvés dans le Google Sheet.`);
    return rows
      .filter((row) => row.length >= 2)
      .map((row) => ({
        nom: row[0],
        date: row[1],
      }));
  } catch (err) {
    console.error("[ANNIV] ❌ Erreur lors de la lecture des anniversaires :", err);
    return [];
  }
}

// --- Vérifie et envoie ---
async function checkAndSendAnniversaires(client: Client) {
  const today = dayjs().format("DD/MM");
  console.log(`[ANNIV] Vérification des anniversaires pour le ${today}...`);

  const anniversaires = await getAnniversaires();
  if (!anniversaires.length) {
    console.log("[ANNIV] Aucun anniversaire à traiter aujourd’hui.");
    return;
  }

  for (const anniv of anniversaires) {
    const dateFormatee = dayjs(anniv.date, ["DD/MM/YYYY", "DD/MM"]).format("DD/MM");

    if (dateFormatee === today && !anniversairesSouhaitesAujourdHui.has(anniv.nom)) {
      const channel = client.channels.cache.get(ANNIV_CHANNEL_ID) as TextChannel;
      if (!channel) {
        console.warn("[ANNIV] ⚠️ Salon d'anniversaire introuvable !");
        return;
      }

      console.log(`[DISCORD] Envoi du message d’anniversaire à ${anniv.nom} dans #${channel.name}`);
      await channel.send(
        `🍰 **Joyeux anniversaire ${anniv.nom} !** 🎉  
La Taverne t’offre une pinte bien fraîche pour fêter ça 🍺`
      );

      anniversairesSouhaitesAujourdHui.add(anniv.nom);
      console.log(`[ANNIV] Anniversaire souhaité à : ${anniv.nom}`);
    }
  }
}

// --- Réinitialise le cache à minuit ---
function resetCacheMinuit() {
  anniversairesSouhaitesAujourdHui.clear();
  console.log("[ANNIV] ♻️ Cache des anniversaires réinitialisé.");
}

// --- Fonction d'init ---
export function initAnniversaires(client: Client) {
  console.log("[ANNIV] 📅 Système d'anniversaires démarré...");

  // Vérifie au démarrage
  checkAndSendAnniversaires(client);

  // Vérifie toutes les 3h (à ajuster si besoin, pour du “tous les jours à 9h” il faudra autre chose)
  setInterval(() => checkAndSendAnniversaires(client), 1000 * 60 * 60 * 3);

  // Reset cache à minuit
  setInterval(resetCacheMinuit, 1000 * 60 * 60 * 24);
}
