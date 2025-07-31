import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, TextChannel } from "discord.js";
import { kickLogo, kickGreen, defaultClipImage } from "../config.js";

export default {
  name: "testclip",
  description: "Envoie un embed de test pour les clips Kick",

  async execute(message: Message) {
    const clipUrl = `https://kick.com/${process.env.KICK_USERNAME}/clip/test-slug`;

    const embed = new EmbedBuilder()
      .setColor(kickGreen)
      .setAuthor({ name: "🎬 Nouveau clip de la Taverne !", iconURL: kickLogo })
      .setTitle("Moment épique de la taverne")
      .setURL(clipUrl)
      .setImage(defaultClipImage)
      .setDescription(`Une scène digne des chroniques vient d'être figée dans le temps sur **Kick** ! 🏰  
**Auteur :** Testeur`)
      .setFooter({
        text: "Le Tavernier • Clip Kick",
        iconURL: kickLogo,
      })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("▶️ Voir le clip")
        .setStyle(ButtonStyle.Link)
        .setURL(clipUrl)
    );

    if (message.channel && message.channel.isTextBased()) {
      const textChannel = message.channel as TextChannel;
      await textChannel.send({ embeds: [embed], components: [row] });
      await message.reply("✅ Embed de test envoyé !");
    } else {
      await message.reply("⚠️ Impossible d'envoyer l'embed ici.");
    }
  }
};
