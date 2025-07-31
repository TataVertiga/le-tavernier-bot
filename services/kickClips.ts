import axios from "axios";
import fs from "fs";
import path from "path";
import type { Client, TextChannel } from "discord.js";
import { createClipEmbed } from "../embedTemplates.js";

const lastClipsFile = path.join(process.cwd(), "last_clips.json");
let clipInterval: NodeJS.Timeout | null = null;

// --- Sauvegarde avec purge des vieux clips ---
function savePostedClips(clips: string[]) {
  const limitedClips = clips.slice(-50); // Garde seulement les 50 derniers
  fs.writeFileSync(lastClipsFile, JSON.stringify(limitedClips, null, 2));
  console.log(`[KICK-CLIPS] 💾 Sauvegarde clips postés (total: ${limitedClips.length})`);
}

// --- Marque un clip comme déjà posté ---
function markClipAsPosted(clipId: string) {
  let postedClips: string[] = [];
  if (fs.existsSync(lastClipsFile)) {
    postedClips = JSON.parse(fs.readFileSync(lastClipsFile, "utf8"));
  }

  postedClips.push(clipId);
  savePostedClips(postedClips); // Purge si > 50
}

// --- Vérifie si déjà posté ---
function alreadyPosted(clipId: string): boolean {
  if (!fs.existsSync(lastClipsFile)) return false;
  const postedClips: string[] = JSON.parse(fs.readFileSync(lastClipsFile, "utf8"));
  return postedClips.includes(clipId);
}

// --- Récupération et envoi des clips ---
async function checkNewClips(client: Client) {
  console.log("[KICK-CLIPS] 📡 Vérification des nouveaux clips...");

  try {
    const { data } = await axios.get(
      `https://kick.com/api/v2/channels/${process.env.KICK_USERNAME}/clips`
    );

    if (!data || !Array.isArray(data)) {
      console.log("[KICK-CLIPS] ❌ Impossible de récupérer les clips.");
      return;
    }

    const newClips = data.filter((clip: any) => !alreadyPosted(clip.slug));

    if (newClips.length === 0) {
      console.log("[KICK-CLIPS] 📭 Aucun nouveau clip trouvé.");
      return;
    }

    console.log(`[KICK-CLIPS] 🎬 ${newClips.length} nouveau(x) clip(s) trouvé(s)`);

    const channel = client.channels.cache.get(process.env.CLIPS_CHANNEL_ID || "") as TextChannel;
    if (!channel) {
      console.error("[KICK-CLIPS] ❌ Salon clips introuvable.");
      return;
    }

    for (const clip of newClips) {
      const embedPayload = createClipEmbed(
        process.env.KICK_USERNAME || "",
        clip.slug,
        clip.thumbnail?.url || "https://i.imgur.com/EvS2L1m.jpeg",
        clip.creator?.username || "Inconnu"
      );

      await channel.send(embedPayload);
      markClipAsPosted(clip.slug);
      console.log(`[KICK-CLIPS] 📢 Clip posté : ${clip.slug}`);
    }
  } catch (err) {
    console.error("[KICK-CLIPS] ❌ Erreur récupération clips :", err);
  }
}

// --- Ajuste la fréquence de vérif selon le statut live ---
export function updateClipCheckFrequency(client: Client, isLive: boolean) {
  if (clipInterval) clearInterval(clipInterval);

  const intervalTime = isLive ? 60 * 1000 : 5 * 60 * 1000; // 1 min en live, 5 min hors live
  clipInterval = setInterval(() => checkNewClips(client), intervalTime);

  console.log(`[KICK-CLIPS] ⏱ Vérification clips toutes les ${intervalTime / 1000}s`);
}

export function initKickClips(client: Client) {
  console.log("[KICK-CLIPS] 🚀 Initialisation...");
  updateClipCheckFrequency(client, false); // Par défaut hors live
}
