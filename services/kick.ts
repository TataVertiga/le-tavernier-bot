import fs from "fs";
import path from "path";
import type { Client, TextChannel } from "discord.js";
import { publierTweetLiveKick, resetTweetMemory } from "./twitter.js";
import { updateClipCheckFrequency } from "./kickClips.js"; // ✅ Gestion auto clips
import { createLiveEmbed } from "../embedTemplates.js";

let lastStatus = false;
let kickToken = "";

const lastDiscordFile = path.join(process.cwd(), "last_discord.json");

type KickResponse = {
  data: {
    slug: string;
    stream?: { is_live: boolean } | null;
    livestream?: { is_live: boolean } | null;
  }[];
};

type KickTokenBody = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

// --- Vérifie si déjà notifié ---
function alreadyNotifiedDiscord(): boolean {
  if (fs.existsSync(lastDiscordFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastDiscordFile, "utf8"));
      if (data.liveId === process.env.KICK_USERNAME) return true;
    } catch {}
  }
  return false;
}

// --- Marque comme notifié ---
function markDiscordNotified() {
  fs.writeFileSync(
    lastDiscordFile,
    JSON.stringify({ liveId: process.env.KICK_USERNAME, time: Date.now() })
  );
}

// --- Reset mémoire ---
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
      grant_type: "client_credentials",
    }),
  });

  if (response.status !== 200) {
    console.error(`[KICK] ❌ Erreur récupération token : ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 15000));
    return getKickToken();
  }
  return response.json();
}

// --- Envoi embed Discord via Discord.js ---
async function sendDiscordEmbed(client: Client) {
  if (alreadyNotifiedDiscord()) {
    console.log("[DISCORD] ⚠️ Notif bloquée : déjà envoyée pour ce live.");
    return;
  }

  const channel = client.channels.cache.get(process.env.CHANNEL_ID || "") as TextChannel;
  if (!channel) {
    console.error("[DISCORD] ❌ Salon introuvable");
    return;
  }

  const embedPayload = createLiveEmbed(process.env.KICK_USERNAME || "");
  await channel.send(embedPayload);

  markDiscordNotified();
  console.log("[DISCORD] 📢 Notification Kick envoyée !");
}

// --- Vérification live Kick ---
async function checkKickLive(client: Client) {
  console.log("[KICK] 📡 Vérification de l'état du live...");

  const response = await fetch(
    `https://api.kick.com/public/v1/channels?slug=${process.env.KICK_USERNAME}`,
    {
      method: "GET",
      headers: { Authorization: "Bearer " + kickToken },
    }
  );

  if (response.status === 401) {
    console.log("[KICK] ♻️ Token expiré → Rafraîchissement...");
    kickToken = (await getKickToken()).access_token;
    return checkKickLive(client);
  } else if (response.status !== 200) {
    console.error(`[KICK] ❌ Erreur API : ${response.status}`);
    return setTimeout(() => checkKickLive(client), 30000);
  }

  const data: KickResponse = await response.json();
  let isLive =
    data.data[0]?.stream?.is_live ??
    data.data[0]?.livestream?.is_live ??
    false;

  if (process.env.DEBUG_KICK_LOGS === "true") {
    console.log("[DEBUG] Réponse Kick brute :", JSON.stringify(data, null, 2));
  }

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

  // ✅ Mise à jour auto de la fréquence de vérif des clips
  updateClipCheckFrequency(client, isLive);

  if (isLive && !lastStatus) {
    console.log("[KICK] ✅ Live détecté → Envoi notifications...");
    await sendDiscordEmbed(client);
    await publierTweetLiveKick();
  } else if (!isLive && lastStatus) {
    resetDiscordMemory();
    resetTweetMemory();
  }

  lastStatus = isLive;
  setTimeout(() => checkKickLive(client), 60000);
}

// --- Initialisation Kick ---
export async function initKick(client: Client) {
  console.log("[KICK] 🚀 Initialisation du système de détection...");
  kickToken = (await getKickToken()).access_token;
  checkKickLive(client);
}
