import axios from "axios";
import fs from "fs";
import path from "path";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.CHANNEL_ID) throw new Error("❌ CHANNEL_ID manquant dans le .env");
const DISCORD_CHANNEL_ID = process.env.CHANNEL_ID!;
const YT_API = process.env.YOUTUBE_API_KEY!;
const YT_CHANNEL = process.env.YOUTUBE_CHANNEL_ID!;

const lastFile = path.join(process.cwd(), "data", "last_youtube.json");

function getLastId(): string | null {
  if (fs.existsSync(lastFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastFile, "utf8"));
      return data.lastId || null;
    } catch {
      return null;
    }
  }
  return null;
}

function saveLastId(id: string) {
  fs.mkdirSync(path.dirname(lastFile), { recursive: true });
  fs.writeFileSync(lastFile, JSON.stringify({ lastId: id }, null, 2));
}

export async function checkYoutube(client: Client) {
  try {
    console.log("🔍 Vérification des nouvelles vidéos YouTube...");

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YT_CHANNEL}&order=date&maxResults=5&type=video&key=${YT_API}`;
    const searchRes = await axios.get(searchUrl);
    const videos = searchRes.data.items;
    if (!videos || videos.length === 0) return;

    const lastId = getLastId();
    let newVideo: any = null;

    for (const video of videos) {
      const videoId = video.id.videoId;

      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,liveStreamingDetails&key=${YT_API}&id=${videoId}`;
      const detailsRes = await axios.get(detailsUrl);
      const info = detailsRes.data.items[0];
      if (!info) continue;

      const liveStatus = info.snippet.liveBroadcastContent;
      const title = info.snippet.title.toLowerCase();
      const duration = info.contentDetails.duration;

      // 🚫 Ignorer les lives & premières
      if (liveStatus !== "none") continue;
      if (title.includes("live") || title.includes("direct") || title.includes("premiere")) continue;

      // Shorts = < 60 secondes → inclus
      const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      const minutes = parseInt(match?.[1] || "0");
      const seconds = parseInt(match?.[2] || "0");
      const totalSeconds = minutes * 60 + seconds;

      if (totalSeconds <= 60) {
        console.log(`✅ Short détecté : ${info.snippet.title}`);
      } else {
        console.log(`✅ Vidéo détectée : ${info.snippet.title}`);
      }

      if (videoId === lastId) continue; // déjà annoncé

      newVideo = info;
      break;
    }

    // 📌 Premier lancement → juste enregistrer l'ID
    if (!lastId && newVideo) {
      console.log("📌 Premier lancement : ID enregistré, aucune annonce envoyée.");
      saveLastId(newVideo.id);
      return;
    }

    // 📢 Annonce Discord si nouvelle vidéo
    if (newVideo) {
      saveLastId(newVideo.id);

      const channel = client.channels.cache.get(DISCORD_CHANNEL_ID) as TextChannel;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor("#ff0000") // 🔴 Rouge YouTube
        .setAuthor({
          name: "📺 Nouvelle vidéo à la Taverne !",
          iconURL: "https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png"
        })
        .setTitle(newVideo.snippet.title)
        .setURL(`https://youtu.be/${newVideo.id}`)
        .setDescription(`🍺 Ô gueux ! Tata Vertiga vient de servir un nouveau tonneau visuel à la Taverne !  
[**Clique ici pour voir la cuvée**](https://youtu.be/${newVideo.id}) avant que ça se réchauffe !`)
        .setImage(newVideo.snippet.thumbnails.maxres?.url || newVideo.snippet.thumbnails.high.url)
        .setFooter({ text: "Le Tavernier vous sert en continu" })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      console.log("✅ Nouvelle vidéo YouTube annoncée !");
    } else {
      console.log("ℹ️ Aucune nouvelle vidéo trouvée.");
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Erreur YouTube :", err.message);
    } else {
      console.error("❌ Erreur YouTube :", err);
    }
  }
}
