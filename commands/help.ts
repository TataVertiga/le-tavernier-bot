import { EmbedBuilder, Message } from 'discord.js';

export default {
  name: 'help',
  description: "Affiche la carte du Tavernier",
  execute(message: Message) {
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("🍺 La Carte du Tavernier")
      .setDescription("Voici les commandes que tu peux brailler dans la taverne :")
      .addFields(
        { name: "📜 `t!help`", value: "**`t!help`**\u2003→ Affiche ce menu, abruti." },
        { name: "🧠 `t!douzinite`", value: "**`t!douzinite`**\u2003→ Analyse si t’as pas causé avec ton fondement." },
        { name: "💨 `t!prout`", value: "**`t!prout`**\u2003→ Lâche un pet... sonore." },
        { name: "👋 `t!bonjour`", value: "**`t!bonjour`**\u2003→ Souhaite la bienvenue à ta façon, gueux." },
        { 
          name: "🎂 `t!anniv`", 
          value: 
            "**`t!anniv set JJ-MM`**\u2003→ Enregistre ton anniversaire\n" +
            "**`t!anniv set JJ-MM-AAAA`**\u2003→ Enregistre avec ton année de naissance\n" +
            "**`t!anniv list`**\u2003→ Voir tous les anniversaires enregistrés\n" +
            "**`t!anniv remove`**\u2003→ Supprime ton anniversaire\n" +
            "💡 À minuit pile, le Tavernier te souhaite un joyeux anniversaire... à sa façon 🍺"
        },
        { name: "🔔 Mention Tavernier", value: "**Ping Tavernier**\u2003→ Ose me ping et j’te répondrai comme il se doit..." },
        { name: "🧪 À venir", value: "C'est un secret... pour l'instant." }
      )
      .setFooter({
        text: "Le Tavernier • T'as soif ? Moi aussi.",
        iconURL: message.client.user?.displayAvatarURL() ?? undefined
      });

    (message.channel as any).send({ embeds: [embed] });
  }
};
