import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  TextChannel
} from "discord.js";
import fs from "fs";
import path from "path";

const giveawaysPath = path.join(process.cwd(), "data", "giveaways.json");

// ✅ Crée le fichier si inexistant
if (!fs.existsSync(giveawaysPath)) {
  fs.writeFileSync(giveawaysPath, "{}");
}

// ⚙️ Config
const ADMIN_ROLE_ID = "837442801599512607"; // Rôle admin
const GIVEAWAY_CHANNEL_ID = "1123654628681199677"; // Channel où poster
const MAX_PARTICIPANTS = 10; // 100% atteint à partir de ce nombre

// --- Génère la barre de chope RP ---
export function getChopeBar(participants: number) {
  const percent = Math.min(100, Math.round((participants / MAX_PARTICIPANTS) * 100));
  const filled = Math.floor(percent / 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  let message = "";
  if (percent <= 20) message = "Un timide gueux s’avance timidement…";
  else if (percent <= 50) message = "La taverne commence à sentir la sueur et la bière.";
  else if (percent <= 80) message = "Ça hurle, ça rigole, les paris s’ouvrent !";
  else message = "Le chaos est total, ça va finir en bagarre générale.";

  return { bar, message };
}

export default {
  name: "giveaway",
  description: "Lance ou annule un giveaway RP",

  async execute(message: Message, args: string[]) {
    // --- Vérif admin ---
    if (!message.member?.roles.cache.has(ADMIN_ROLE_ID)) {
      return message.reply("⛔ T’es pas tavernier toi, touche pas à ça !");
    }

    // --- Annulation ---
    if (args[0] && args[0].toLowerCase() === "cancel") {
      const data = JSON.parse(fs.readFileSync(giveawaysPath, "utf8"));
      const activeId = Object.keys(data)[0];
      if (!activeId) return message.reply("🍺 Aucun giveaway en cours, gueux.");
      delete data[activeId];
      fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 2));
      console.log(`[GIVEAWAY] Annulé manuellement (ID: ${activeId}, par: @${message.author.username})`);
      return message.reply("❌ Giveaway annulé, tout le monde rentre chez soi !");
    }

    // --- Aide / usage ---
    if (!args[0]) {
      return message.reply(
        "❓ **Utilisation de la commande :**\n" +
        "`t!giveaway <durée> <récompense>` pour lancer un giveaway.\n" +
        "Exemples : `t!giveaway 1h Un bon d'achat Steam`, `t!giveaway 5m Un skin unique`, `t!giveaway 2d Abonnement Nitro`\n" +
        "Utilise `t!giveaway cancel` pour annuler le dernier giveaway.\n" +
        "Si tu ne précises pas de récompense, ça affichera : *À toi de voir tavernier*."
      );
    }

    // --- Durée ---
    const duration = parseDuration(args[0]);
    if (!duration) {
      return message.reply(
        "⛔ Durée invalide !\n" +
        "Exemples valides : `t!giveaway 1h`, `t!giveaway 5m`, `t!giveaway 2d`\n" +
        "Unités : `s` = secondes, `m` = minutes, `h` = heures, `d` = jours"
      );
    }

    // --- Récompense personnalisée
    const reward = args.slice(1).join(" ") || "À toi de voir tavernier";

    const endTime = Date.now() + duration;
    const giveawayId = Date.now().toString();

    const { bar, message: rp } = getChopeBar(0);

    const embed = new EmbedBuilder()
      .setColor(0xdaa520)
      .setTitle("🏆 Giveaway de la Taverne !")
      .setDescription(`🎁 **Récompense** : ${reward}  
🍺 **Participants** : ${bar} (0)  
*${rp}*  

📅 Fin <t:${Math.floor(endTime / 1000)}:R>`)
      .setFooter({ text: "Clique sur la chope pour participer !" });

    const button = new ButtonBuilder()
      .setCustomId(`giveaway_join_${giveawayId}`)
      .setLabel("🍺 Participer")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const channel = message.client.channels.cache.get(GIVEAWAY_CHANNEL_ID) as TextChannel;
    const msg = await channel.send({
      content: `🍻 **Un giveaway est lancé !** 🍻`,
      embeds: [embed],
      components: [row]
    });

    // Sauvegarde
    const data = JSON.parse(fs.readFileSync(giveawaysPath, "utf8"));
    data[giveawayId] = {
      messageId: msg.id,
      channelId: GIVEAWAY_CHANNEL_ID,
      endTime,
      participants: [],
      description: `🎁 **Récompense** : ${reward}`
    };
    fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 2));

    console.log(`[GIVEAWAY] Nouveau lancé (ID: ${giveawayId}, fin: ${new Date(endTime).toLocaleString()}, salon: #${GIVEAWAY_CHANNEL_ID}, récompense: ${reward})`);
    message.reply("✅ Giveaway lancé, gueux !");
  }
};

// --- Conversion durée ---
function parseDuration(str: string) {
  const match = str.match(/(\d+)([smhd])/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return num * multipliers[unit];
}
