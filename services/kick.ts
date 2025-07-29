import axios from "axios";
import fs from "fs";
import path from "path";
import { publierTweetLiveKick, resetTweetMemory } from './twitter.js';

let lastStatus = false;
let kickToken = "";

// ✅ Fichier pour éviter double notif Discord
const lastDiscordFile = path.join(process.cwd(), 'last_discord.json');

// ✅ Image RP fixe pour annonce initiale
const defaultImage = "https://media.discordapp.net/attachments/845579523013869569/888428596572602368/SPOILER_tataVertiga_preview.png";

// ✅ Type exact de la réponse Kick
type KickResponse = {
  data: {
    slug: string;
    livestream: {
      is_live: boolean;
      thumbnail?: {
        url: string; // URL de preview si dispo
      };
    } | null;
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

// --- Envoi initial embed Discord ---
async function sendDiscordEmbed(previewUrl: string) {
  const res = await axios.post(
    `https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`,
    {
      content: `<@&881684792058466354> 🍺 Mortecouille bande de gueux ! Un live sauvage apparaît !`,
      embeds: [
        {
          title: "⚔️ TataVertiga est EN LIVE sur Kick !",
          description: `**La taverne s’anime, les gueux s’agitent…**  
Rejoins-nous pour un moment épique sur Kick 🏰

[▶️ **Clique ici pour rejoindre le live**](https://kick.com/${process.env.KICK_USERNAME})`,
          color: 0x00ff00,
          thumbnail: { url: "https://kick.com/favicon.ico" },
          image: { url: previewUrl },
          footer: { text: "Le Tavernier • Live Kick Alert", icon_url: "https://kick.com/favicon.ico" },
          timestamp: new Date().toISOString()
        }
      ]
    },
    { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}`, "Content-Type": "application/json" } }
  );

  return res.data.id; // ID du message pour édition
}

// --- Mise à jour embed avec preview Kick ---
async function updateDiscordEmbedWithPreview(messageId: string) {
  for (let i = 0; i < 5; i++) { // Essaye 5 fois (toutes les 3 sec)
    await new Promise(r => setTimeout(r, 3000));

    const res = await fetch(`https://api.kick.com/public/v1/channels?slug=${process.env.KICK_USERNAME}`, {
      method: "GET",
      headers: { "Authorization": "Bearer " + kickToken }
    });
    const data: KickResponse = await res.json();
    const livePreview = data.data[0]?.livestream?.thumbnail?.url
      || `https://static-cdn.kick.com/live_thumbnails/${process.env.KICK_USERNAME}.jpg`;

    if (livePreview && !livePreview.includes("favicon")) {
      console.log("[DISCORD] 🎯 Preview Kick trouvée → mise à jour de l'embed");

      await axios.patch(
        `https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages/${messageId}`,
        {
          embeds: [
            {
              title: "⚔️ TataVertiga est EN LIVE sur Kick !",
              description: `**La taverne s’anime, les gueux s’agitent…**  
Rejoins-nous pour un moment épique sur Kick 🏰

[▶️ **Clique ici pour rejoindre le live**](https://kick.com/${process.env.KICK_USERNAME})`,
              color: 0x00ff00,
              thumbnail: { url: "https://kick.com/favicon.ico" },
              image: { url: livePreview },
              footer: { text: "Le Tavernier • Live Kick Alert", icon_url: "https://kick.com/favicon.ico" },
              timestamp: new Date().toISOString()
            }
          ]
        },
        { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}`, "Content-Type": "application/json" } }
      );
      break; // Stop si trouvé
    }
  }
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
  let isLive = data.data[0]?.livestream?.is_live ?? false;

  // --- Mode debug simulation ---
  if (process.env.DEBUG_KICK_MODE === 'LIVE') {
    console.log("[KICK] 🛠 Mode DEBUG → Simulation début de live");
    isLive = true;
    lastStatus = false;
  }
  else if (process.env.DEBUG_KICK_MODE === 'OFF') {
    console.log("[KICK] 🛠 Mode DEBUG → Simulation fin de live");
    isLive = false;
    lastStatus = true;
  }

  console.log(`[KICK] 🎥 isLive: ${isLive}`);

  if (isLive && !lastStatus) {
    console.log("[KICK] ✅ Live détecté → Envoi notifications...");

    if (!alreadyNotifiedDiscord()) {
      const messageId = await sendDiscordEmbed(defaultImage);
      updateDiscordEmbedWithPreview(messageId);
      markDiscordNotified();
      console.log("[DISCORD] 📢 Notification envoyée + mise à jour prévue !");
    } else {
      console.log("[DISCORD] ⚠️ Déjà notifié → Pas de doublon.");
    }

    // 🐦 Tweet auto
    await publierTweetLiveKick();
  }
  else if (!isLive && lastStatus) {
    resetDiscordMemory();
    resetTweetMemory();
  }

  lastStatus = isLive;
  setTimeout(checkKickLive, 60000);
}

export async function initKick() {
  console.log("[KICK] 🚀 Initialisation du système de détection...");
  kickToken = (await getKickToken()).access_token;
  checkKickLive();
}
