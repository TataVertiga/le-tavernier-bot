// services/kickClips.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import { Client, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const lastClipFile = path.join(process.cwd(), "last_kick_clip.json");

let clipCheckInterval: NodeJS.Timeout | null = null;
let currentInterval = 5 * 60 * 1000;

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
    const url = `https://kick.com/api/v2/channels/${process.env.KICK_USERNAME}/clips`;
    const { data } = await axios.get(url);

    if (!Array.isArray(data) || data.length === 0) return;

    const latestClip = data[0];
    const lastClipId = fs.existsSync(lastClipFile)
      ? JSON.parse(fs.readFileSync(lastClipFile, "utf8")).id
      : null;

    if (latestClip.id !== lastClipId) {
      const clipUrl = `https://kick.com/${process.env.KICK_USERNAME}/clip/${latestClip.slug}`;
      const channel = client.channels.cache.get("926619311613804544") as TextChannel;

      if (channel) {
        // 📌 Création de l'embed
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle(`🎬 ${latestClip.title}`)
          .setURL(clipUrl)
          .setImage(latestClip.thumbnail?.url || latestClip.thumbnail || "https://kick.com/favicon.ico")
          .setDescription(`Un moment épique vient d'être immortalisé sur **Kick** ! ⚔️  
**Auteur :** ${latestClip.created_by?.username || "Inconnu"}`)
          .setFooter({
            text: "Le Tavernier • Clip Kick",
            iconURL: "https://kick.com/favicon.ico"
          })
          .setTimestamp();

        // 📌 Bouton Discord cliquable
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("▶️ Voir le clip")
            .setStyle(ButtonStyle.Link)
            .setURL(clipUrl)
        );

        await channel.send({ embeds: [embed], components: [row] });
        fs.writeFileSync(lastClipFile, JSON.stringify({ id: latestClip.id }));
        console.log(`✅ Clip posté (embed + bouton) : ${latestClip.title}`);
      }
    }
  } catch (err) {
    console.error("❌ Erreur récupération clips Kick :", err);
  }
}
