const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CHANNEL_ID_KICK = "1397681937082220687";
const ROLE_KICK = "<@&881684792058466354>";
const KICK_USERNAME = "tatavertiga";
const STORAGE_PATH = path.join(__dirname, "../data/last_kick_status.txt");

let lastKickStatus = false;

if (fs.existsSync(STORAGE_PATH)) {
  lastKickStatus = fs.readFileSync(STORAGE_PATH, "utf8") === "true";
}

async function checkKickLive(client) {
  try {
    const res = await axios.get(`https://kick.com/api/v1/channels/${KICK_USERNAME}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const isLive = res.data.livestream !== null;
    console.log("🟢 Live Kick détecté :", isLive, "| Dernier statut connu :", lastKickStatus);

    if (isLive && !lastKickStatus) {
      const channel = await client.channels.fetch(CHANNEL_ID_KICK);
      console.log("→ Envoi du message dans le salon :", channel.name || channel.id);
      const msg = await channel.send(`:bell: Mortecouille bande de Gueux ${ROLE_KICK} TataVertiga lance un live sauvage et ce n'est pas sorcellerie Messire... https://kick.com/${KICK_USERNAME}`);

      if (channel.type === 15 && msg.crosspostable) {
        await msg.crosspost();
        console.log("↪️ Message crossposté dans le salon d’annonce");
      }

      fs.writeFileSync(STORAGE_PATH, "true");
    }

    if (!isLive && lastKickStatus) {
      fs.writeFileSync(STORAGE_PATH, "false");
    }

    lastKickStatus = isLive;
  } catch (err) {
    console.error("❌ Erreur Kick:", err.message);
  }
}

module.exports = { checkKickLive };
