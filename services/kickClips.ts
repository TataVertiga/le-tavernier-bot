import axios from "axios";
import fs from "fs";
import path from "path";
import type { Client, TextChannel } from "discord.js";
import { kickLogo, kickGreen, defaultClipImage } from "../config.js";

let lastClipSlug: string | null = null;
let clipCheckInterval: NodeJS.Timeout | null = null;

const lastClipFile = path.join(process.cwd(), "last_clip.json");

// --- Lecture dernier clip envoyé ---
function getLastClipSlug(): string | null {
  if (fs.existsSync(lastClipFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastClipFile, "utf8"));
      return data.slug || null;
    } catch {}
  }
  return null;
}

// --- Sauvegarde dernier clip envoyé ---
function saveLastClipSlug(slug: string) {
  fs.writeFileSync(lastClipFile, JSON.stringify({ slug, time: Date.now() }));
}

// --- Récupération des clips Kick ---
async function fetchLatestClip() {
  try {
    const { data } = await axios.get(`https://kick.com/api/v2/channels/${process.env.KICK_USERNAME}/clips`);
    return data?.clips?.[0] || null;
  } catch (err) {
    console.error("[KICK-CLIP] ❌ Erreur récupération clips :", err);
    return null;
  }
}

// --- Envoi embed Discord ---
async function sendClipEmbed(clip: any, client: Client) {
  if (!clip?.slug) return;

  const clipUrl = `https://kick.com/${process.env.KICK_USERNAME}/clip/${clip.slug}`;
  const clipImage = clip?.thumbnail?.url || defaultClipImage;

  const embed = {
    color: kickGreen,
    author: {
      name: "🎬 Nouveau clip de la Taverne !",
      icon_url: kickLogo,
    },
    title: clip?.title || "Moment épique !",
    url: clipUrl,
    description: `Une scène digne des chroniques vient d'être figée dans le temps sur **Kick** ! 🏰  
**Auteur :** ${clip?.creator?.username || "Inconnu"}`,
    image: { url: clipImage },
    footer: {
      text: "Le Tavernier • Clip Kick",
      icon_url: kickLogo,
    },
    timestamp: new Date().toISOString(),
  };

  const row = {
    type: 1,
    components: [
      {
        type: 2,
        style: 5,
        label: "▶️ Voir le clip",
        url: clipUrl,
      },
    ],
  };

  const channel = client.channels.cache.get(process.env.CHANNEL_ID || "") as TextChannel;
  if (channel) {
    await channel.send({ embeds: [embed], components: [row] });
    console.log(`[KICK-CLIP] 📢 Clip envoyé : ${clip.slug}`);
  }
}

// --- Vérification périodique ---
async function checkClips(client: Client) {
  const latestClip = await fetchLatestClip();
  if (!latestClip) return;

  const storedSlug = getLastClipSlug();
  if (storedSlug !== latestClip.slug) {
    saveLastClipSlug(latestClip.slug);
    await sendClipEmbed(latestClip, client);
  }
}

// --- Modifie la fréquence de vérif en fonction du live ---
export function updateClipCheckFrequency(client: Client, isLive: boolean) {
  if (clipCheckInterval) clearInterval(clipCheckInterval);

  if (isLive) {
    console.log("[KICK-CLIP] 📡 Passage en mode live → vérification toutes les 60s");
    clipCheckInterval = setInterval(() => checkClips(client), 60 * 1000);
  } else {
    console.log("[KICK-CLIP] ⏳ Mode hors live → vérification toutes les 10min");
    clipCheckInterval = setInterval(() => checkClips(client), 10 * 60 * 1000);
  }
}
