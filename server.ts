// Nouveau server.js avec anti-double-post (début de live uniquement) et API officielle Kick
const { get, post } = require("axios");
const { TwitterApi } = require("twitter-api-v2");
const express = require('express')


const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function publierTweetLiveKick() {
  try {
    const message = `📢 ALERTE LIVE – Tata Vertiga a posé ses miches sur Kick, ramène ton cul c’est chaud ! 🔥 https://kick.com/${KICK_USERNAME}`;
    await twitterClient.v2.tweet(message);
    console.log("✅ Tweet publié avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors de la publication du tweet :", err);
  }
}

const PORT = process.env.PORT || 3000;
const DISCORD_CHANNEL_ID = process.env.CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const KICK_USERNAME = process.env.KICK_USERNAME;
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const app = express()

let lastStatus = false;

type KickResponse = {
  data:{
    livestream:boolean
  }
}

async function checkKickLive() {
  try {
    /*const res = await (new Promise<KickResponse>((resolve) => {
    setTimeout(() => {
        resolve({
        data: {
            livestream: Math.random() > 0.5 ? true : false
        }
        });
    }, 2000);
    }));*/

    const res = await get(`https://kick.com/api/v1/channels/${KICK_USERNAME}`, {
      headers: {
        "Client-ID": KICK_CLIENT_ID,
        "User-Agent": "Mozilla/5.0"
      }
    });

    const isLive = res.data.livestream;
    console.log("Islive status:", isLive);

    if (isLive && !lastStatus) {
      console.log(":white_check_mark: LIVE détecté via API officielle Kick ! Envoi Discord...");
      await post(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
// await publierTweetLiveKick(); // désactivé temporairement (twitter.js manquant)
        content: `:bell: Mortecouille bande de Gueux <@&881684792058466354> TataVertiga lance un live sauvage et ce n'est pas sorcellerie Messire... https://kick.com/${KICK_USERNAME}`
      }, {
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
          "Content-Type": "application/json"
        }
      });
    }
    else if (!isLive && lastStatus)
      console.log(":white_check_mark: FIN de LIVE détecté via API officielle Kick !");

    lastStatus = isLive;
    setTimeout(checkKickLive, 60 * 1000);
  } catch (err: any) {
    console.error(":x: Erreur Kick (API officielle):", err.message);
  }
}

checkKickLive();

app.get("/", (_: any, res: { send: (arg0: string) => void; }) => {
  res.send("Kick Watcher connecté à l'API officielle.");
});

app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur le port ${PORT}`));