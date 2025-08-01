import fs from "fs";
import path from "path";
import cron from "node-cron";
import { Client, TextChannel } from "discord.js";

const dataPath = path.join(process.cwd(), "data");
const birthdaysFile = path.join(dataPath, "birthdays.json");
const lastBirthdayFile = path.join(dataPath, "lastBirthday.json");

const CHANNEL_ID = "837135924390264855";

// Phrases avec âge
const withAge = [
  "souffle ses **{age} hivers** et toujours pas foutu de finir sa bière",
  "vient de survivre à {age} années de beuveries",
  "{age} ans et toujours aucune leçon retenue 🍺",
  "{age} hivers passés à vider des pintes",
  "{age} ans… et pas une ride, sauf au foie",
  "fête ses {age} ans et a déjà perdu {age} litres de foie",
  "{age} ans et toujours en train de boire à crédit",
  "{age} ans de bringues, et ça continue !",
  "depuis {age} ans, il/elle met la honte au tonneau",
  "a survécu à {age} hivers… et quelques matins difficiles"
];

// Phrases sans âge
const withoutAge = [
  "un an de plus, toujours aussi bancal",
  "c’est son jour, et pourtant il est déjà torché",
  "fête encore un an de beuverie",
  "n’a toujours pas compris que vieillir, c’est mal",
  "prend de l’âge… mais pas de sagesse",
  "vieillit comme le bon vin… mais sent toujours la bière",
  "un an de plus et toujours pas foutu de payer sa tournée",
  "n’a toujours pas trouvé la fontaine de jouvence",
  "un an de plus, et pas une ride… sauf au foie",
  "fête ça avec plus de mousse que de dignité"
];

function loadBirthdays(): Record<string, { date: string; year?: number }> {
  if (!fs.existsSync(birthdaysFile)) return {};
  return JSON.parse(fs.readFileSync(birthdaysFile, "utf8"));
}

function loadLastBirthday(): string {
  if (!fs.existsSync(lastBirthdayFile)) return "";
  return JSON.parse(fs.readFileSync(lastBirthdayFile, "utf8")).lastDate || "";
}

function saveLastBirthday(date: string) {
  fs.writeFileSync(lastBirthdayFile, JSON.stringify({ lastDate: date }, null, 0), "utf8");
}

export function initAnniversaires(client: Client) {
  cron.schedule("0 0 * * *", () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const dayMonth = today.toISOString().slice(5, 10);

    console.log(`[ANNIV] Vérification des anniversaires du jour : ${dateStr}`);

    const lastDate = loadLastBirthday();
    if (lastDate === dateStr) {
      console.log("[ANNIV] Message déjà envoyé aujourd'hui, on ne répète pas 🍺");
      return;
    }

    const birthdays = loadBirthdays();
    const matches = Object.entries(birthdays).filter(([_, b]) => b.date === dayMonth);

    if (!matches.length) {
      console.log("[ANNIV] Aucun gueux ne fête son anniversaire aujourd'hui 💤");
      return;
    }

    console.log(`[ANNIV] Trouvé ${matches.length} anniversaire(s) aujourd'hui 🎉`);
    console.log("[ANNIV] Préparation du message RP...");

    const lines = matches.map(([id, b]) => {
      if (b.year) {
        const age = today.getFullYear() - b.year;
        return `- <@${id}> ${withAge[Math.floor(Math.random() * withAge.length)].replace("{age}", age.toString())}`;
      } else {
        return `- <@${id}> ${withoutAge[Math.floor(Math.random() * withoutAge.length)]}`;
      }
    });

    const message = `🍻 HOYYYY MES GUEUX !\nAujourd'hui, on rince la gorge de :\n${lines.join("\n")}\n\nLevez vos chopes et préparez vos foies !`;

    const channel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
    if (channel) {
      channel.send(message);
      console.log(`[DISCORD] Message d'anniversaire envoyé dans #taverne (ID: ${CHANNEL_ID})`);
    }

    saveLastBirthday(dateStr);
  }, {
    timezone: "Europe/Paris"
  });
}
