import axios from "axios";
import fs from "fs";
import path from "path";
import { publierTweetLiveKick, resetTweetMemory } from './twitter.js';

let lastStatus = false;
let kickToken = "";

// ✅ Fichier pour éviter double notif Discord
const lastDiscordFile = path.join(process.cwd(), 'last_discord.json');

// ✅ Type exact de la réponse Kick
type KickResponse = {
  data: {
    stream: {
      is_live: boolean;
    } | null; // parfois null si pas en live
  }[];
};

type KickTokenBody = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

// --- Fonctions de gestion anti-doublon Discord ---
function alreadyNotifiedDiscord(): boolean {
  if (fs.existsSync(lastDiscordFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastDiscordFile, 'utf8'));
      if (data.liveId === process.env.KICK_USERNAME) {
        return true;
      }
    } catch {}
  }
  return false;
}

function markDiscordNotified() {
  fs.writeFileSync(
    lastDiscordFile,
    JSON.stringify({ liveId: process.env.KICK_USERNAME, time: Date.now() })
  );
}

function resetDiscordMemory() {
  if (fs.existsSync(lastDiscordFile)) {
    fs.unlinkSync(lastDiscordFile);
    console.log("[DISCORD] ♻️ Mémoire notification réinitialisée.");
  } else {
    console.log("[DISCORD] ♻️ Rien à réinitialiser (déjà vide).");
  }
}

// --- Token Kick ---
async function getKickToken(): Promise<KickTokenBody> {
  console.log("[KICK] 🔑 Récupération du token...");
  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.KICK_CLIENT_ID || "",
      client_secret: process.env.KICK_CLIENT_SECRET || "",
      grant_type: "client_credentials"
    })
  });

  if (response.status != 200) {
    console.error(`[KICK] ❌ Erreur récupération token : ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 15000));
    return getKickToken();
  }
  return response.json();
}

// --- Vérification live Kick ---
async function checkKickLive() {
  console.log("[KICK] 📡 Vérification de l'état du live...");

  const response = await fetch(`https://api.kick.com/public/v1/channels?slug=${process.env.KICK_USERNAME}`, {
    method: 'GET',
    headers: { "Authorization": "Bearer " + kickToken }
  });

  if (response.status == 401) {
    console.log("[KICK] ♻️ Token expiré → Rafraîchissement...");
    kickToken = (await getKickToken()).access_token;
    return checkKickLive();
  }
  else if (response.status != 200) {
    console.error(`[KICK] ❌ Erreur API : ${response.status}`);
    return setTimeout(checkKickLive, 30000);
  }

  const data: KickResponse = await response.json();
  let isLive = data.data[0]?.stream?.is_live ?? false;

  // --- Mode debug simulation ---
  if (process.env.DEBUG_KICK_MODE === 'LIVE') {
    console.log("[KICK] 🛠 Mode DEBUG → Simulation début de live");
    isLive = true;
    lastStatus = false; // force un nouveau live
  }
  else if (process.env.DEBUG_KICK_MODE === 'OFF') {
    console.log("[KICK] 🛠 Mode DEBUG → Simulation fin de live");
    isLive = false;
    lastStatus = true; // force fin de live
  }

  console.log(`[KICK] 🎥 isLive: ${isLive}`);

  if (isLive && !lastStatus) {
    console.log("[KICK] ✅ Live détecté → Envoi notifications...");

    // 🔹 Protection anti-double notif Discord
    if (!alreadyNotifiedDiscord()) {
      await axios.post(`https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`, {
        content: `:bell: Mortecouille bande de Gueux <@&881684792058466354> TataVertiga lance un live sauvage et ce n'est pas sorcellerie Messire... https://kick.com/${process.env.KICK_USERNAME}`
      }, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          "Content-Type": "application/json"
        }
      });
      markDiscordNotified();
      console.log("[DISCORD] 📢 Notification envoyée !");
    } else {
      console.log("[DISCORD] ⚠️ Déjà notifié → Pas de doublon.");
    }

    // 🐦 Tweet auto
    await publierTweetLiveKick();
  }
  else if (!isLive && lastStatus) {
    resetDiscordMemory(); // reset Discord
    resetTweetMemory();   // reset Twitter
  }

  lastStatus = isLive;
  setTimeout(checkKickLive, 60000);
}

export async function initKick() {
  console.log("[KICK] 🚀 Initialisation du système de détection...");
  kickToken = (await getKickToken()).access_token;
  checkKickLive();
}
