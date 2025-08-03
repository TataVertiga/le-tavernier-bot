// events/interactionCreate.ts
import { Client, EmbedBuilder, Interaction } from "discord.js";
import fs from "fs";
import path from "path";
import { getChopeBar } from "../commands/giveaway.js";

const giveawaysPath = path.join(process.cwd(), "data", "giveaways.json");

export default function registerGiveawayInteraction(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("giveaway_join_")) return;

    const giveawayId = interaction.customId.replace("giveaway_join_", "");
    const data = JSON.parse(fs.readFileSync(giveawaysPath, "utf8"));
    const giveaway = data[giveawayId];
    if (!giveaway) {
      return interaction.reply({ content: "⛔ Giveaway introuvable.", ephemeral: true });
    }

    // Anti double-participation
    if (giveaway.participants.includes(interaction.user.id)) {
      return interaction.reply({ content: "🍺 T'as déjà vidé ta chope, laisse-en aux autres !", ephemeral: true });
    }

    giveaway.participants.push(interaction.user.id);
    fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 2));

    // Met à jour la barre de chope + RP
    const { bar, message: rp } = getChopeBar(giveaway.participants.length);

    // Récupère le message à modifier
    const channel = interaction.channel;
    if (!channel || !("messages" in channel)) return;
    const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!msg) return;

    // Mets à jour l’embed
    const embed = msg.embeds[0];
    if (!embed) return;
    const rewardLine = giveaway.description || "🎁 **Récompense** : À toi de voir tavernier";
    const newEmbed = EmbedBuilder.from(embed)
      .setDescription(`${rewardLine}
🍺 **Participants** : ${bar} (${giveaway.participants.length})
*${rp}*

📅 Fin <t:${Math.floor(giveaway.endTime / 1000)}:R>`);

    await msg.edit({ embeds: [newEmbed] });

    await interaction.reply({ content: "🍻 Participation validée ! Bonne chance, gueux !", ephemeral: true });
  });
}
