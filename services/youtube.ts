// services/youtube.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import { Client, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.CHANNEL_ID) throw new Error("[YOUTUBE] ❌ CHANNEL_ID manquant dans le .env");
const DISCORD_CHANNEL_ID = process.env.CHANNEL_ID!;
const YT_API = process.env.YOUTUBE_API_KEY!;
const YT_CHANNEL = process.env.YOUTUBE_CHANNEL_ID!;

const lastFile = path.join(process.cwd(), "data", "last_youtube.json");

type LastData = { lastIds: string[]; lastDate?: string };

function getLastData(): LastData {
  if (fs.existsSync(lastFile)) {
    try {
      return JSON.parse(fs.readFileSync(lastFile, "utf8")) as LastData;
    } catch {
      return { lastIds: [] };
    }
  }
  return { lastIds: [] };
}

function saveLastData(videoId: string, publishedAt: string) {
  let data = getLastData();
  if (!data.lastIds) data.lastIds = [];
  data.lastIds.unshift(videoId);
  data.lastIds = data.lastIds.slice(0, 10);
  data.lastDate = publishedAt;
  fs.mkdirSync(path.dirname(lastFile), { recursive: true });
  fs.writeFileSync(lastFile, JSON.stringify(data, null, 2));
}

export async function checkYoutube(client: Client) {
  try {
    console.log("[YOUTUBE] 🔍 Vérification des nouvelles vidéos...");

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YT_CHANNEL}&order=date&maxResults=5&type=video&key=${YT_API}`;
    const searchRes = await axios.get(searchUrl);
    const videos = searchRes.data.items;
    if (!videos || videos.length === 0) {
      console.log("[YOUTUBE] ℹ️ Aucune vidéo trouvée dans l'API.");
      return;
    }

    const lastData = getLastData();
    let newVideo: any = null;

    for (const video of videos) {
      const videoId = video.id?.videoId;
      if (!videoId) continue;

      // 📌 Ignorer si déjà annoncé
      if (lastData.lastIds.includes(videoId)) continue;

      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,liveStreamingDetails&key=${YT_API}&id=${videoId}`;
      const detailsRes = await axios.get(detailsUrl);
      const info = detailsRes.data.items?.[0];
      if (!info) continue;

      const title = info?.snippet?.title?.toLowerCase() || "";
      if (!title) continue; // si pas de titre → on ignore

      const liveStatus = info?.snippet?.liveBroadcastContent || "none";
      const duration = info?.contentDetails?.duration || "";
      const publishedAt = info?.snippet?.publishedAt || "";

      // 🚫 Ignorer lives & premières
      if (liveStatus !== "none") continue;
      if (title.includes("live") || title.includes("direct") || title.includes("premiere")) continue;

      // 📌 Ignorer si plus vieux que dernière vidéo annoncée
      if (lastData.lastDate && new Date(publishedAt) < new Date(lastData.lastDate)) continue;

      // Shorts = < 60s → inclus
      const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      const minutes = parseInt(match?.[1] || "0");
      const seconds = parseInt(match?.[2] || "0");
      const totalSeconds = minutes * 60 + seconds;

      if (totalSeconds <= 60) {
        console.log(`[YOUTUBE] ✅ Short détecté : ${info.snippet.title}`);
      } else {
        console.log(`[YOUTUBE] ✅ Vidéo détectée : ${info.snippet.title}`);
      }

      newVideo = info;
      break;
    }

    if (!newVideo) {
      console.log("[YOUTUBE] ℹ️ Aucune nouvelle vidéo trouvée.");
      return;
    }

    // 📌 Sauvegarde historique
    saveLastData(newVideo.id, newVideo.snippet.publishedAt);

    // 📢 Publication Discord
    const channel = client.channels.cache.get(DISCORD_CHANNEL_ID) as TextChannel;
    if (!channel) {
      console.error("[YOUTUBE] ❌ Salon Discord introuvable.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setAuthor({
        name: "📺 Nouvelle vidéo à la Taverne !",
        iconURL: "https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png",
      })
      .setTitle(newVideo.snippet.title)
      .setURL(`https://youtu.be/${newVideo.id}`)
      .setDescription(`🍺 Ô gueux ! Tata Vertiga vient de servir un nouveau tonneau visuel à la Taverne !  
[**Clique ici pour voir la cuvée**](https://youtu.be/${newVideo.id}) avant que ça se réchauffe !`)
      .setImage(newVideo.snippet.thumbnails.maxres?.url || newVideo.snippet.thumbnails.high.url)
      .setFooter({ text: "Le Tavernier vous sert en continu" })
      .setTimestamp();

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("📺 Voir la vidéo")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://youtu.be/${newVideo.id}`)
    );

    await channel.send({ embeds: [embed], components: [button] });
    console.log("[YOUTUBE] 📢 Nouvelle vidéo YouTube annoncée !");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[YOUTUBE] ❌ Erreur API :", err.message);
    } else {
      console.error("[YOUTUBE] ❌ Erreur API inconnue :", err);
    }
  }
}