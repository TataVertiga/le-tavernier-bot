import { google } from "googleapis";
import fs from "fs";
import path from "path";

const credentialsPath = path.join(process.cwd(), "data", "credentials.json");
const spreadsheetId = process.env.GOOGLE_SHEET_ID || ""; // ID du Google Sheets

if (!spreadsheetId) {
  console.error("[ANNIV] ❌ GOOGLE_SHEET_ID manquant dans .env !");
}

function getAuth() {
  if (!fs.existsSync(credentialsPath)) {
    throw new Error("[ANNIV] ❌ credentials.json introuvable !");
  }
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// --- Lecture complète (format objet : userId -> {date, year}) ---
export async function readBirthdays() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const range = "Anniversaires!A2:C";
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values || [];
  const birthdays: Record<string, { date: string; year?: number }> = {};

  rows.forEach((row) => {
    const [userId, date, year] = row;
    if (userId && date) {
      birthdays[userId] = { date, ...(year ? { year: parseInt(year) } : {}) };
    }
  });

  return birthdays;
}

// --- Écriture complète (remplace tout A2:C) ---
export async function writeBirthdays(data: Record<string, { date: string; year?: number }>) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const values = Object.entries(data).map(([userId, info]) => [
    userId,
    info.date,
    info.year || "",
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Anniversaires!A2:C",
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// --- Ajoute ou modifie UN anniversaire ---
export async function setBirthday(userId: string, date: string, year?: number) {
  const birthdays = await readBirthdays();
  birthdays[userId] = { date, ...(year ? { year } : {}) };
  await writeBirthdays(birthdays);
}

// --- Supprime UN anniversaire ---
export async function removeBirthday(userId: string) {
  const birthdays = await readBirthdays();
  if (birthdays[userId]) {
    delete birthdays[userId];
    await writeBirthdays(birthdays);
    return true;
  }
  return false;
}
