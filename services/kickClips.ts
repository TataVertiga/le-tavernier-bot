import axios from "axios";
import fs from "fs";
import path from "path";
import type { Client } from "discord.js";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();

const lastClipFile = path.join(process.cwd(), "data", "last_kick_clip.json");
const defaultClipImage = "https://i.imgur.com/8Q2mpgI.png"; // ✅ Image RP par défaut
const kickLogo = "https://i.imgur.com/cUUpk6X.jpeg"; // ✅ Logo Kick personnalisé

// --- Anti-doublon pour les clips ---
function alreadyPostedClip(clipId: string): boolean {
  if (fs.existsSync(lastClipFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastClipFile, "utf8"));
      if (data.lastClipId === clipId) return true;
    } catch {}
  }
  return false;
}

function markClipPosted(clipId: string) {
  fs.writeFileSync(lastClipFile, JSON.stringify({ lastClipId: clipId, time: Date.now() }));
}

// --- Récupération du dernier clip Kick ---
async function fetchLatestClip(): Promise<{ id: string; title: string; url: string; thumbnail: string } | null> {
  try {
    const channelName = process.env.KICK_USERNAME;
    const clipsUrl = `https://kick.com/${channelName}/clips`;

    const { data: html } = await axios.get(clipsUrl);
    const $ = cheerio.load(html);

    const clipElement = $("a[href*='/clip/']").first();
    if (!clipElement.length) return null;

    const clipUrl = `https://kick.com${clipElement.attr("href")}`;
    const clipId = clipElement.attr("href")?.split("/").pop() || "";

    // Titre (si disponible)
    const title = clipElement.find("p").first().text().trim() || "Clip sans titre";

    // Miniature
    let thumbnail = clipElement.find("img").attr("src") || defaultClipImage;
    if (thumbnail.startsWith("//")) thumbnail = "https:" + thumbnail;

    return { id: clipId, title, url: clipUrl, thumbnail };
  } catch (err) {
    console.error("[KICK CLIPS] ❌ Erreur récupération clip :", err);
    return null;
  }
}

// --- Envoi embed Discord pour les clips ---
async function sendClipToDiscord(clip: { id: string; title: string; url: string; thumbnail: string }) {
  await axios.post(
    `https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`,
    {
      content: `🎬 Nouveau clip Kick dispo à la taverne !`,
      embeds: [
        {
          color: 0x00ff00, // Vert Kick
          author: {
            name: "📹 Clip Kick à la Taverne",
            icon_url: kickLogo, // ✅ Logo Kick personnalisé
          },
          title: clip.title,
          url: clip.url,
          image: { url: clip.thumbnail || defaultClipImage },
          footer: {
            text: "Le Tavernier • Clip Kick",
            icon_url: kickLogo, // ✅ Logo Kick dans le footer aussi
          },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "▶️ Voir le clip",
              url: clip.url,
            },
          ],
        },
      ],
    },
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("[DISCORD] 📢 Nouveau clip Kick envoyé !");
}

// --- Fréquence de vérification clips ---
let clipInterval: NodeJS.Timeout | null = null;

export function updateClipCheckFrequency(client: Client, isLive: boolean) {
  if (isLive) {
    if (!clipInterval) {
      console.log("[KICK CLIPS] 🎥 Live détecté → Vérification clips toutes les 2 min");
      clipInterval = setInterval(() => checkForNewClip(client), 2 * 60 * 1000);
    }
  } else {
    if (clipInterval) {
      console.log("[KICK CLIPS] 💤 Fin de live → Arrêt vérification clips");
      clearInterval(clipInterval);
      clipInterval = null;
    }
  }
}

// --- Vérification et envoi clip ---
async function checkForNewClip(client: Client) {
  const latestClip = await fetchLatestClip();
  if (!latestClip) return;

  if (!alreadyPostedClip(latestClip.id)) {
    await sendClipToDiscord(latestClip);
    markClipPosted(latestClip.id);
  } else {
    console.log("[KICK CLIPS] ⚠️ Clip déjà envoyé, pas de doublon.");
  }
}
