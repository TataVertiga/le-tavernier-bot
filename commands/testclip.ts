import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, TextChannel } from "discord.js";

export default {
  name: "testclip",
  description: "Envoie un embed de test pour les clips Kick",

  async execute(message: Message) {
    const clipUrl = `https://kick.com/${process.env.KICK_USERNAME}/clip/test-slug`;

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`🎬 Moment épique de la taverne`)
      .setURL(clipUrl)
      .setImage("https://i.imgur.com/EvS2L1m.jpeg")
      .setDescription(`Une scène digne des chroniques vient d'être figée dans le temps sur **Kick** ! 🏰  
**Auteur :** Testeur`)
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

    // ✅ Vérifie que c'est bien un salon texte
    if (message.channel && message.channel.isTextBased()) {
      const textChannel = message.channel as TextChannel; // cast TS
      await textChannel.send({ embeds: [embed], components: [row] });
      await message.reply("✅ Embed de test envoyé !");
    } else {
      await message.reply("⚠️ Impossible d'envoyer l'embed ici.");
    }
  }
};
