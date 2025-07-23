const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CHANNEL_ID_TIKTOK = "845579568488251412";
const TIKTOK_USERNAME = "tatavertiga";
const STORAGE_PATH = path.join(__dirname, "../data/last_tiktok_id.txt");

let lastTikTokId = null;

// Charger depuis le fichier au démarrage
if (fs.existsSync(STORAGE_PATH)) {
  lastTikTokId = fs.readFileSync(STORAGE_PATH, "utf8");
}

async function checkTikTok(client) {
  try {
    const url = `https://www.tiktok.com/@${TIKTOK_USERNAME}`;
    const response = await axios.get(url);
    const match = response.data.match(/"id":"(\d{19})"/);

    if (match) {
      const currentId = match[1];
      if (currentId !== lastTikTokId) {
        lastTikTokId = currentId;
        fs.writeFileSync(STORAGE_PATH, currentId);
        const channel = await client.channels.fetch(CHANNEL_ID_TIKTOK);
        await channel.send(`📱 Tata a pondu un nouveau TikTok pour les gueux : https://www.tiktok.com/@${TIKTOK_USERNAME}/video/${currentId}`);
      }
    }
  } catch (err) {
    console.error("Erreur TikTok:", err.message);
  }
}

module.exports = { checkTikTok };
