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
  console.log("🎞 Surveillance des clips Kick activée...");
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
    const url = `https://kick.com/${process.env.KICK_USERNAME}?tab=clips`;

    // Imitation d’un vrai navigateur
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Referer": `https://kick.com/${process.env.KICK_USERNAME}`
      }
    });

    const $ = cheerio.load(html);

    // Kick encode les infos clips dans des scripts JSON → on les récupère
    const jsonData = $('script#__NEXT_DATA__').html();
    if (!jsonData) return;

    const parsed = JSON.parse(jsonData);
    const clips = parsed.props.pageProps.data.clips || [];

    if (clips.length === 0) return;

    const latestClip = clips[0];
    const lastClipId = fs.existsSync(lastClipFile)
      ? JSON.parse(fs.readFileSync(lastClipFile, "utf8")).id
      : null;

    if (latestClip.id !== lastClipId) {
      const clipUrl = `https://kick.com/${process.env.KICK_USERNAME}/clip/${latestClip.slug}`;
      const channel = client.channels.cache.get("926619311613804544") as TextChannel;

      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle(`🎬 ${latestClip.title}`)
          .setURL(clipUrl)
          .setImage(latestClip.thumbnail?.url || "https://kick.com/favicon.ico")
          .setDescription(`Une scène digne des chroniques vient d'être figée dans le temps sur **Kick** ! 🏰  
**Auteur :** ${latestClip.created_by?.username || "Inconnu"}`)
          .setFooter({
            text: "Le Tavernier • Clip Kick",
            iconURL: "https://kick.com/favicon.ico"
          })
          .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("▶️ Voir le clip")
            .setStyle(ButtonStyle.Link)
            .setURL(clipUrl)
        );

        await channel.send({ embeds: [embed], components: [row] });
        fs.writeFileSync(lastClipFile, JSON.stringify({ id: latestClip.id }));
        console.log(`✅ Clip posté (scraper) : ${latestClip.title}`);
      }
    }
  } catch (err) {
    console.error("❌ Erreur récupération clips Kick :", err.message);
  }
}