const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "Affiche la carte du Tavernier",
  execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6) // Violet (style Discord)
      .setTitle("🍺 La Carte du Tavernier")
      .setDescription("Voici les commandes que tu peux brailler dans la taverne :")
      .addFields(
        { name: "📜 `t!help`", value: "Affiche ce menu, abruti." },
        { name: "🧠 `t!douzinite`", value: "Analyse si t’as pas causé avec ton fondement." },
        { name: "💨 `t!prout`", value: "Lâche un pet... sonore." },
        { name: "👋 `t!bonjour`", value: "Souhaite la bienvenue à ta façon, gueux." },
        { name: "🔔 Mention Tavernier", value: "Ose me ping et j’te répondrai comme il se doit..." },
        { name: "🧪 À venir", value: "C'est un secret... pour l'instant." }
      )
      .setFooter({
        text: "Le Tavernier • T'as soif ? Moi aussi.",
        iconURL: message.client.user.displayAvatarURL()
      });

    message.channel.send({ embeds: [embed] });
  }
};