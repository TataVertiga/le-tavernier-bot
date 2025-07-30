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
  console.log("🎞 Surveillance des clips KickBot activée...");
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
    const url = `https://www.kickbot.com/clips/${process.env.KICK_USERNAME}`;
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        "Accept": "text/html"
      }
    });

    const $ = cheerio.load(html);

    // Chaque clip est dans un bloc <a href="/clip/...">
    const firstClipElement = $("a[href^='/clip/']").first();
    if (!firstClipElement.length) return;

    const clipPath = firstClipElement.attr("href");
    const clipUrl = `https://www.kickbot.com${clipPath}`;
    const thumbnail = firstClipElement.find("img").attr("src") || "https://kick.com/favicon.ico";
    const title = firstClipElement.find("h3").text().trim() || "Clip sans titre";

    // Récupère l'auteur si dispo
    const author = firstClipElement.find(".clip-author").text().trim() || "Inconnu";

    // Évite les doublons
    const lastClipId = fs.existsSync(lastClipFile)
      ? JSON.parse(fs.readFileSync(lastClipFile, "utf8")).url
      : null;

    if (clipUrl !== lastClipId) {
      const channel = client.channels.cache.get("926619311613804544") as TextChannel;
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle(`🎬 ${title}`)
          .setURL(clipUrl)
          .setImage(thumbnail)
          .setDescription(`Une scène digne des chroniques vient d'être figée dans le temps sur **Kick** ! 🏰  
**Auteur :** ${author}`)
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
        fs.writeFileSync(lastClipFile, JSON.stringify({ url: clipUrl }));
        console.log(`✅ Clip posté (KickBot) : ${title}`);
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("❌ Erreur récupération clips KickBot :", err.message);
    } else {
      console.error("❌ Erreur récupération clips KickBot :", err);
    }
  }
}
