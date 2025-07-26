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

async function checkKickLive() {
  try {
    const res = await get(`https://kick.com/api/v1/channels/${KICK_USERNAME}`, {
      headers: {
        "Client-ID": KICK_CLIENT_ID,
        "User-Agent": "Mozilla/5.0"
      }
    });

    const isLive = res.data.livestream !== null;

    if (isLive && !lastStatus) {
      console.log("✅ LIVE détecté via API officielle Kick ! Envoi Discord...");
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

    lastStatus = isLive;
  } catch (err) {
    console.error("❌ Erreur Kick (API officielle):", err.message);
  }
}

setInterval(checkKickLive, 60000);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
