// services/kick.js
const axios = require("axios");

const CHANNEL_ID_KICK = "845579568488251412";
const ROLE_KICK = "<@&881684792058466354>";
const KICK_USERNAME = "tatavertiga";
let lastKickStatus = false;

async function checkKickLive(client) {
  try {
    const res = await axios.get(`https://kick.com/api/v1/channels/${KICK_USERNAME}`);
    const isLive = res.data.livestream !== null;
    if (isLive && !lastKickStatus) {
      const channel = await client.channels.fetch(CHANNEL_ID_KICK);
      await channel.send(`:bell: Mortecouille bande de Gueux ${ROLE_KICK} TataVertiga lance un live sauvage et ce n'est pas sorcellerie Messire... https://kick.com/tatavertiga`);
    }
    lastKickStatus = isLive;
  } catch (err) {
    console.error("Erreur Kick:", err.message);
  }
}

module.exports = { checkKickLive };
