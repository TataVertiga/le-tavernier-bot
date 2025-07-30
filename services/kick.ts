import axios from "axios";
import fs from "fs";
import path from "path";
import { publierTweetLiveKick, resetTweetMemory } from './twitter.js';

let lastStatus = false;
let kickToken = "";

// ✅ Fichier pour éviter double notif Discord
const lastDiscordFile = path.join(process.cwd(), 'last_discord.json');

// ✅ Image RP fixe
const defaultImage = "https://i.imgur.com/8Q2mpgI.png"; 

// ✅ Type réponse Kick
type KickResponse = {
  data: {
    slug: string;
    stream?: {
      is_live: boolean;
    } | null;
    livestream?: {
      is_live: boolean;
    } | null;
  }[];
};

type KickTokenBody = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

// --- Fonctions anti-doublon Discord ---
function alreadyNotifiedDiscord(): boolean {
  if (fs.existsSync(lastDiscordFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastDiscordFile, 'utf8'));
      if (data.liveId === process.env.KICK_USERNAME) return true;
    } catch {}
  }
  return false;
}

function markDiscordNotified() {
  fs.writeFileSync(lastDiscordFile, JSON.stringify({ liveId: process.env.KICK_USERNAME, time: Date.now() }));
}

function resetDiscordMemory() {
  if (fs.existsSync(lastDiscordFile)) {
    fs.unlinkSync(lastDiscordFile);
    console.log("[DISCORD] ♻️ Mémoire notification réinitialisée.");
  }
}

// --- Token Kick ---
async function getKickToken(): Promise<KickTokenBody> {
  console.log("[KICK] 🔑 Récupération du token...");
  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
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

// --- Envoi embed Discord ---
async function sendDiscordEmbed() {
  await axios.post(
    `https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`,
    {
      content: `🍺 Mortecouille bande de gueux ! Un live sauvage apparaît sur <@&881684792058466354> !`,
      embeds: [
        {
          title: "⚔️ TATA LANCE UN LIVE SUR KICK !",
          description: `**La taverne s’anime, les gueux s’agitent…**  
Les pintes se remplissent et la musique résonne.  

▶️ [**Clique ici pour rejoindre le live**](https://kick.com/${process.env.KICK_USERNAME})`,
          color: 0x00ff00,
          thumbnail: { url: "https://kick.com/favicon.ico" },
          image: { url: defaultImage },
          footer: { text: "Le Tavernier • Live Kick Alert", icon_url: "https://kick.com/favicon.ico" },
          timestamp: new Date().toISOString()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "🍺 Entrer dans la taverne",
              url: `https://kick.com/${process.env.KICK_USERNAME}`
            }
          ]
        }
      ]
    },
    { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}`, "Content-Type": "application/json" } }
  );

  console.log("[DISCORD] 📢 Notification envoyée !");
}

// --- Vérification live Kick ---
async function checkKickLive() {
  console.log("[KICK] 📡 Vérification de l'état du live...");

  const response = await fetch(`https://api.kick.com/public/v1/channels?slug=${process.env.KICK_USERNAME}`, {
    method: "GET",
    headers: { "Authorization": "Bearer " + kickToken }
  });

  if (response.status == 401) {
    console.log("[KICK] ♻️ Token expiré → Rafraîchissement...");
    kickToken = (await getKickToken()).access_token;
    return checkKickLive();
  } else if (response.status != 200) {
    console.error(`[KICK] ❌ Erreur API : ${response.status}`);
    return setTimeout(checkKickLive, 30000);
  }

  const data: KickResponse = await response.json();

  // 📌 Lecture compatible avec ancienne et nouvelle API Kick
  let isLive = data.data[0]?.stream?.is_live 
            ?? data.data[0]?.livestream?.is_live 
            ?? false;

  // Mode debug
  if (process.env.DEBUG_KICK_MODE === "LIVE") {
    console.log("[KICK] 🛠 Mode DEBUG → Simulation début de live");
    isLive = true;
    lastStatus = false;
  } else if (process.env.DEBUG_KICK_MODE === "OFF") {
    console.log("[KICK] 🛠 Mode DEBUG → Simulation fin de live");
    isLive = false;
    lastStatus = true;
  }

  console.log(`[KICK] 🎥 isLive: ${isLive}`);

  if (isLive && !lastStatus) {
    console.log("[KICK] ✅ Live détecté → Envoi notifications...");

    if (!alreadyNotifiedDiscord()) {
      await sendDiscordEmbed();
      markDiscordNotified();
    } else {
      console.log("[DISCORD] ⚠️ Déjà notifié → Pas de doublon.");
    }

    await publierTweetLiveKick();
  } else if (!isLive && lastStatus) {
    resetDiscordMemory();
    resetTweetMemory();
  }

  lastStatus = isLive;
  setTimeout(checkKickLive, 60000);
}

// --- Initialisation Kick ---
export async function initKick() {
  console.log("[KICK] 🚀 Initialisation du système de détection...");
  kickToken = (await getKickToken()).access_token;
  checkKickLive();
}
