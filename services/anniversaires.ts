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

// --- Répliques personnalisées ---
const REPLIQUES_AGE = [
  (userId: string, age: number) => `🍻 Bon anniversaire <@${userId}> ! Encore un an de plus au compteur, ça commence à sentir la poussière (tu as maintenant ${age} ans) !`,
  (userId: string, age: number) => `🎉 Santé <@${userId}> ! ${age} ans aujourd’hui… On ne dirait pas, et pourtant la bière ne ment jamais.`,
  (userId: string, age: number) => `🥳 Joyeux anniversaire <@${userId}> ! ${age} ans, et pas une ride (enfin presque). Passe boire ta pinte !`,
  (userId: string, age: number) => `🍰 Un an de plus pour <@${userId}>, ${age} ans, t’approches de la catégorie vétéran de la Taverne !`,
  (userId: string, age: number) => `🎂 <@${userId}>, ${age} ans aujourd’hui ! Tu gagnes le droit d’offrir ta tournée à tous les gueux présents.`
];

const REPLIQUES_SANS_AGE = [
  (userId: string) => `🍻 Bon anniversaire <@${userId}> ! L’âge, c’est dans la tête (et parfois dans le foie).`,
  (userId: string) => `🎉 <@${userId}>, la Taverne te souhaite un anniversaire mystérieux, comme ton âge.`,
  (userId: string) => `🥳 On ne connaît pas ton âge, mais joyeux anniversaire quand même <@${userId}> ! Profite bien !`,
  (userId: string) => `🍰 Bon anniversaire à notre gueux anonyme préféré, <@${userId}> !`,
  (userId: string) => `🎂 Tu refuses de donner ton âge, <@${userId}> ? Pas grave, t’as quand même le droit à une pinte offerte !`
];

// --- Helper : parser robuste qui gère JJ-MM[-YYYY] ou MM-JJ[-YYYY] avec tirets ou slash
function parseDateSmart(dateString: string): { day: string, month: string, year?: string } | null {
  if (!dateString) return null;
  const parts = dateString.replace(/\//g, "-").split("-");
  if (parts.length === 2) {
    let [a, b] = parts;
    if (parseInt(a, 10) > 12) return { day: a.padStart(2, "0"), month: b.padStart(2, "0") };
    if (parseInt(b, 10) > 12) return { day: b.padStart(2, "0"), month: a.padStart(2, "0") };
    return { day: a.padStart(2, "0"), month: b.padStart(2, "0") };
  }
  if (parts.length === 3) {
    let [a, b, c] = parts;
    if (c.length === 4) {
      if (parseInt(a, 10) > 12) return { day: a.padStart(2, "0"), month: b.padStart(2, "0"), year: c };
      if (parseInt(b, 10) > 12) return { day: b.padStart(2, "0"), month: a.padStart(2, "0"), year: c };
      return { day: a.padStart(2, "0"), month: b.padStart(2, "0"), year: c };
    }
    return null;
  }
  return null;
}

// --- Lecture Google Sheets (A: userId, B: date (JJ-MM ou JJ-MM-YYYY), C: year si colonne séparée) ---
async function getAnniversaires(): Promise<{ userId: string; date: string; year?: string }[]> {
  try {
    console.log("[ANNIV] Lecture des données Google Sheets…");
    const sheets = google.sheets({ version: "v4", auth: GOOGLE_API_KEY });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Anniversaires!A2:C", // 3 colonnes !
    });

    const rows = res.data.values || [];
    console.log(`[ANNIV] ${rows.length} anniversaires trouvés dans le Google Sheet.`);
    return rows
      .filter((row) => row.length >= 2)
      .map((row) => ({
        userId: row[0],
        date: row[1],
        year: row[2], // Peut être undefined ou vide
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

  const channel = client.channels.cache.get(ANNIV_CHANNEL_ID) as TextChannel;
  if (!channel) {
    console.warn("[DISCORD] ⚠️ Salon d'anniversaire introuvable ! Vérifie ANNIV_CHANNEL_ID.");
    return;
  }

  let count = 0;
  for (const anniv of anniversaires) {
    const parsed = parseDateSmart(anniv.date.replace(/\//g, "-"));
    if (!parsed) continue;

    const dateFormatee = `${parsed.day}/${parsed.month}`;

    if (dateFormatee === today && !anniversairesSouhaitesAujourdHui.has(anniv.userId)) {
      let age: number | undefined = undefined;
      const year = parsed.year || anniv.year;
      if (year && parsed.day && parsed.month) {
        age = dayjs().diff(dayjs(`${year}-${parsed.month}-${parsed.day}`), "year");
      }
      let message: string;
      if (age !== undefined) {
        const r = Math.floor(Math.random() * REPLIQUES_AGE.length);
        message = REPLIQUES_AGE[r](anniv.userId, age);
      } else {
        const r = Math.floor(Math.random() * REPLIQUES_SANS_AGE.length);
        message = REPLIQUES_SANS_AGE[r](anniv.userId);
      }

      try {
        await channel.send(message);
        anniversairesSouhaitesAujourdHui.add(anniv.userId);
        count++;
        console.log(`[DISCORD] Anniversaire souhaité à : <@${anniv.userId}>`);
      } catch (err) {
        console.error(`[DISCORD] ❌ Impossible de souhaiter l’anniv à <@${anniv.userId}> :`, err);
      }
    }
  }

  if (count === 0) {
    console.log("[ANNIV] Aucun nouvel anniversaire à souhaiter aujourd'hui.");
  }
}

// --- Réinitialise le cache à minuit ---
function resetCacheMinuit() {
  anniversairesSouhaitesAujourdHui.clear();
  console.log("[ANNIV] ♻️ Cache des anniversaires réinitialisé.");
}

// --- Fonction d'init principale ---
export function initAnniversaires(client: Client) {
  console.log("[ANNIV] 📅 Système d'anniversaires démarré...");

  // Vérifie au démarrage immédiat
  checkAndSendAnniversaires(client);

  // Vérifie toutes les 3h (modifiable selon besoin)
  setInterval(() => checkAndSendAnniversaires(client), 1000 * 60 * 60 * 3);

  // Reset cache à minuit (00:00:05 pour laisser la marge)
  const now = dayjs();
  const nextMidnight = now.add(1, "day").startOf("day").add(5, "second"); // 5 sec après minuit
  setTimeout(() => {
    resetCacheMinuit();
    setInterval(resetCacheMinuit, 1000 * 60 * 60 * 24);
  }, nextMidnight.diff(now));
}
