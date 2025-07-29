import axios from "axios";
import { publierTweetLiveKick } from './twitter.js';

let lastStatus = false;
let kickToken = "";

type KickResponse = {
  data: {
    stream: {
      is_live: boolean
    }
  }
};

type KickTokenBody = {
  access_token: string,
  expires_in: number,
  token_type: string
};

async function getKickToken(): Promise<KickTokenBody> {
  console.log("Récupération du token kick !");
  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: process.env.KICK_CLIENT_ID || "",
      client_secret: process.env.KICK_CLIENT_SECRET || "",
      grant_type: "client_credentials"
    })
  });
  if (response.status != 200) {
    console.error("❌ Erreur Kick pour récupération du token : ", response.status);
    await new Promise((resolve) => { setTimeout(() => { resolve(0); }, 15 * 1000); });
    return getKickToken();
  }
  return response.json();
}

async function checkKickLive() {
  console.log("Récupération des infos de la chaine Kick !");

  const response = await fetch(`https://api.kick.com/public/v1/channels?slug=${process.env.KICK_USERNAME}`, {
    method: 'GET',
    headers: {
      "Authorization": "Bearer " + kickToken
    }
  });

  if (response.status == 401) {
    console.log("Refresh du token Kick !");
    kickToken = (await getKickToken()).access_token;
    return checkKickLive();
  }
  else if (response.status != 200) {
    console.error("❌ Erreur Kick pour la récupération des infos de la chaine : ", response.status);
    return setTimeout(checkKickLive, 30 * 1000);
  }

  const data = await response.json();
  let isLive = data.data[0].stream.is_live;
  console.log("isLive : " + isLive);

  if (isLive && !lastStatus) {
    console.log("✅ LIVE détecté via API officielle Kick ! Envoi Discord...");

    await axios.post(`https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`, {
      content: `:bell: Mortecouille bande de Gueux <@&881684792058466354> TataVertiga lance un live sauvage et ce n'est pas sorcellerie Messire... https://kick.com/${process.env.KICK_USERNAME}`
    }, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    // 🐦 Envoi du tweet automatique
    await publierTweetLiveKick();
  }
  else if (!isLive && lastStatus) {
    console.log("✅ FIN de LIVE détecté via API officielle Kick !");
  }

  lastStatus = isLive;
  setTimeout(checkKickLive, 60 * 1000);
}

export async function initKick() {
  console.log("Initialisation du check pour Kick");
  kickToken = (await getKickToken()).access_token;
  checkKickLive();
}
