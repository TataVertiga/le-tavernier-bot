import { google } from "googleapis";
import fs from "fs";
import path from "path";

const credentialsPath = path.join(process.cwd(), "data", "credentials.json");
const spreadsheetId = process.env.GOOGLE_SHEET_ID || ""; // ID de ton Google Sheets

if (!spreadsheetId) {
  console.error("[GOOGLE] ❌ GOOGLE_SHEET_ID dans .env !");
}

function getAuth() {
  if (!fs.existsSync(credentialsPath)) {
    throw new Error("[GOOGLE] ❌ credentials.json introuvable !");
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return auth;
}

export async function readBirthdays() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // 🔹 Nom de l'onglet "Anniversaires Taverne"
  const range = "Anniversaires!A2:C";

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

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
