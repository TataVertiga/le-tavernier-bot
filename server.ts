require("dotenv").config();
const {get, post} = require("axios");
const { TwitterApi } = require("twitter-api-v2");
const express = require("express");

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
const app = express();

let lastStatus = false;
let kickToken = "";

type KickResponse = {
  data:{
    stream:{
      is_live:boolean
    }
  }
}

type KickTokenBody = {
  access_token:string,
  expires_in:number,
  token_type:string
};

async function getKickToken() : Promise<KickTokenBody>{
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
  if (response.status!=200){
    console.error("❌ Erreur Kick pour récupération du token : ", response.status);
    await new Promise((resolve) => {setTimeout(() => {resolve(0);}, 15 * 1000);});
    return getKickToken();
  }
  return response.json();
}

async function checkKickLive() {
  console.log("Récupération des infos de la chaine Kick !");
  /*const res = await (new Promise<KickResponse_>((resolve) => {
  setTimeout(() => {
      resolve({
      data: {
          livestream: Math.random() > 0.5 ? true : false
      }
      });
  }, 2000);
  }));*/

  const response = await fetch('https://api.kick.com/public/v1/channels?slug='+process.env.KICK_USERNAME, {
    method: 'GET',
    headers: {
      "Authorization": "Bearer "+kickToken
      }
    }
  );

if(response.status==401){
  console.log("Refresh du token Kick !");
  kickToken = (await getKickToken()).access_token;
  return checkKickLive();
}
else if (response.status!=200){
  console.error("❌ Erreur Kick pour la récupération des infos de la chaine : ", response.status);
  return setTimeout(checkKickLive, 30 * 1000);
}

const data = await response.json();
let isLive = data.data[0].stream.is_live;
console.log("isLive : "+isLive);

if (isLive && !lastStatus) {
  console.log("✅ LIVE détecté via API officielle Kick ! Envoi Discord...");
  await post(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
    content: `:bell: Mortecouille bande de Gueux <@&881684792058466354> TataVertiga lance un live sauvage et ce n'est pas sorcellerie Messire... https://kick.com/${KICK_USERNAME}`
    }, {
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
  }
  else if (!isLive && lastStatus)
    console.log("✅ FIN de LIVE détecté via API officielle Kick !");

  lastStatus = isLive;
  setTimeout(checkKickLive, 60 * 1000);
}

app.get("/", (_:any, res:any) => {
  res.send("Le serveur est en ligne !");
});

app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur le port ${PORT}`));

async function init() {
  console.log("Initialisation du check pour Kick");
  kickToken = (await getKickToken()).access_token;
  checkKickLive();
}

init();