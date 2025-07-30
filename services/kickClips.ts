// services/kickClips.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import { Client, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();

const lastClipFile = path.join(process.cwd(), "last_kick_clip.json");

let clipCheckInterval: NodeJS.Timeout | null = null;
let currentInterval = 5 * 60 * 1000; // 5 min par défaut

export async function initKickClips(client: Client) {
  console.log("🎞 Surveillance des clips (KickBot + Kick) activée...");
  startClipCheck(client, currentInterval);
}

function startClipCheck(client: Client, interval: number) {
  if (clipCheckInterval) clearInterval(clipCheckInterval);
  clipCheckInterval = setInterval(() => checkKickClips(client), interval);
}

export async function updateClipCheckFrequency(client: Client, isLive: boolean) {
  const newInterval = isLive ? 30 * 1000 : 5 * 60 * 1000;
  if (newInterval !== currentInterval) {
    currentInterval = newInterval;
    console.log(`⏱ Fréquence vérification clips : ${isLive ? "30 sec" : "5 min"}`);
    startClipCheck(client, currentInterval);
  }
}

async function checkKickClips(client: Client) {
  try {
    let clipData = await getFromKickBot();

    // Si KickBot ne donne rien → fallback sur Kick direct
    if (!clipData) {
      console.warn("⚠️ KickBot indisponible → fallback sur Kick direct");
      clipData = await getFromKickDirect();
    }

    if (!clipData) {
      console.log("⏩ Aucun clip trouvé.");
      return;
    }

    const lastClipId = fs.existsSync(lastClipFile)
      ? JSON.parse(fs.readFileSync(lastClipFile, "utf8")).url
      : null;

    if (clipData.url !== lastClipId) {
      console.log(`✅ Nouveau clip détecté : ${clipData.title}`);

      const channel = client.channels.cache.get("926619311613804544") as TextChannel;
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle(`🎬 ${clipData.title}`)
          .setURL(clipData.url)
          .setImage(clipData.thumbnail)
          .setDescription(`Une scène digne des chroniques vient d'être figée dans le temps sur **Kick** ! 🏰  
**Auteur :** ${clipData.author}`)
          .setFooter({
            text: "Le Tavernier • Clip Kick",
            iconURL: "https://kick.com/favicon.ico"
          })
          .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("▶️ Voir le clip")
            .setStyle(ButtonStyle.Link)
            .setURL(clipData.url)
        );

        await channel.send({ embeds: [embed], components: [row] });
        fs.writeFileSync(lastClipFile, JSON.stringify({ url: clipData.url }));
        console.log(`📤 Clip publié sur Discord : ${clipData.title}`);
      }
    } else {
      console.log("⏩ Aucun nouveau clip détecté.");
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("❌ Erreur récupération clips :", err.message);
    } else {
      console.error("❌ Erreur récupération clips :", err);
    }
  }
}

/**
 * 📌 Méthode 1 : KickBot
 */
async function getFromKickBot() {
  try {
    const url = `https://www.kickbot.com/clips/${process.env.KICK_USERNAME}`;
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(html);
    const firstClipElement = $("a[href^='/clip/']").first();
    if (!firstClipElement.length) return null;

    const clipPath = firstClipElement.attr("href");
    const clipUrl = `https://www.kickbot.com${clipPath}`;
    const thumbnail = firstClipElement.find("img").attr("src") || "https://kick.com/favicon.ico";
    const title = firstClipElement.find("h3").text().trim() || "Clip sans titre";
    const author = firstClipElement.find(".clip-author").text().trim() || "Inconnu";

    return { url: clipUrl, thumbnail, title, author };
  } catch {
    return null;
  }
}

/**
 * 📌 Méthode 2 : Kick direct (fallback)
 */
async function getFromKickDirect() {
  try {
    const url = `https://kick.com/${process.env.KICK_USERNAME}?tab=clips`;
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(html);
    const jsonData = $('script#__NEXT_DATA__').html();
    if (!jsonData) return null;

    const parsed = JSON.parse(jsonData);
    const clips = parsed.props.pageProps.data.clips || [];
    if (clips.length === 0) return null;

    const latestClip = clips[0];
    const clipUrl = `https://kick.com/${process.env.KICK_USERNAME}/clip/${latestClip.slug}`;
    const thumbnail = latestClip.thumbnail?.url || "https://kick.com/favicon.ico";
    const title = latestClip.title || "Clip sans titre";
    const author = latestClip.created_by?.username || "Inconnu";

    return { url: clipUrl, thumbnail, title, author };
  } catch {
    return null;
  }
}
