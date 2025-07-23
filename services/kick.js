const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CHANNEL_ID_KICK = "1397681937082220687";
const ROLE_KICK = "<@&881684792058466354>";
const KICK_USERNAME = "tatavertiga";
const STORAGE_PATH = path.join(__dirname, "../data/last_kick_status.txt");

let lastKickStatus = false;

// Charger le statut précédent si le fichier existe
if (fs.existsSync(STORAGE_PATH)) {
  lastKickStatus = fs.readFileSync(STORAGE_PATH, "utf8") === "true";
}

async function checkKickLive(client) {
  try {
    const res = await axios.get(`https://kick.com/api/v1/channels/${KICK_USERNAME}`);
    const isLive = res.data.livestream !== null;

    if (isLive && !lastKickStatus) {
      const channel = await client.channels.fetch(CHANNEL_ID_KICK);
      const msg = await channel.send(`:bell: Mortecouille bande de Gueux ${ROLE_KICK} TataVertiga lance un live sauvage et ce n'est pas sorcellerie Messire... https://kick.com/${KICK_USERNAME}`);

      // Si c’est un salon d’annonce (type 15), on tente de publier
      if (channel.type === 15 && msg.crosspostable) {
        await msg.crosspost();
      }

      fs.writeFileSync(STORAGE_PATH, "true");
    }

    if (!isLive && lastKickStatus) {
      fs.writeFileSync(STORAGE_PATH, "false");
    }

    lastKickStatus = isLive;
  } catch (err) {
    console.error("Erreur Kick:", err.message);
  }
}

module.exports = { checkKickLive };
