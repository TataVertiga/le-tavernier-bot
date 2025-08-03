// services/giveawayManager.ts
import fs from "fs";
import path from "path";
import { Client, TextChannel } from "discord.js";

const giveawaysPath = path.join(process.cwd(), "data", "giveaways.json");
const CHECK_INTERVAL = 60 * 1000; // Vérifie toutes les minutes

export function resumeGiveaways(client: Client) {
  if (!fs.existsSync(giveawaysPath)) {
    fs.writeFileSync(giveawaysPath, "{}");
  }

  // LOG AU DEMARRAGE (reprise de giveaways)
  const data = JSON.parse(fs.readFileSync(giveawaysPath, "utf8"));
  const nbGiveaways = Object.keys(data).length;
  if (nbGiveaways > 0) {
    console.log(`[GIVEAWAY] Reprise de ${nbGiveaways} giveaway(s) en cours`);
    for (const [id, g] of Object.entries<any>(data)) {
      console.log(`[GIVEAWAY] → ID: ${id}, Fin: ${new Date(g.endTime).toLocaleString()}, Channel: ${g.channelId}`);
    }
  } else {
    console.log("[GIVEAWAY] Pas de giveaway en cours");
  }

  setInterval(() => {
    try {
      const data = JSON.parse(fs.readFileSync(giveawaysPath, "utf8"));
      const now = Date.now();

      for (const [id, g] of Object.entries<any>(data)) {
        if (now >= g.endTime) {
          endGiveaway(client, id, g, data);
        }
      }
    } catch (err) {
      console.error("[GIVEAWAY] Erreur dans la reprise :", err);
    }
  }, CHECK_INTERVAL);
}

async function endGiveaway(client: Client, giveawayId: string, giveaway: any, data: any) {
  try {
    const channel = client.channels.cache.get(giveaway.channelId) as TextChannel;
    if (!channel) {
      console.warn(`[GIVEAWAY] Salon introuvable pour ${giveawayId}`);
      delete data[giveawayId];
      fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 2));
      return;
    }

    const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!msg) {
      console.warn(`[GIVEAWAY] Message introuvable pour ${giveawayId}`);
      delete data[giveawayId];
      fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 2));
      return;
    }

    let winnerText = "";
    if (!giveaway.participants || giveaway.participants.length === 0) {
      winnerText = "Aucun gueux n’a participé… 🍺";
      console.log(`[GIVEAWAY] Aucun participant pour le tirage (ID: ${giveawayId})`);
    } else {
      const winnerId = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
      winnerText = `🎉 Bravo à <@${winnerId}> qui remporte la récompense ! 🍻`;
      console.log(`[GIVEAWAY] Tirage effectué (ID: ${giveawayId}, gagnant: ${winnerId})`);
    }

    await channel.send(`🏆 **Fin du Giveaway !**\n${winnerText}`);

    // Retirer du fichier
    delete data[giveawayId];
    fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 2));

    // Désactiver les boutons
    if (msg.editable) {
      msg.edit({ components: [] }).catch(() => null);
    }

    console.log(`[GIVEAWAY] Terminé : ${giveawayId}`);
  } catch (err) {
    console.error(`[GIVEAWAY] Erreur lors de la clôture :`, err);
  }
}
