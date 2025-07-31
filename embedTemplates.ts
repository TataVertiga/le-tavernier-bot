// 🎨 Modèles d'embed centralisés pour Le Tavernier

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageCreateOptions
} from "discord.js";
import { kickLogo, kickGreen, defaultClipImage, liveRoleId } from "./config.js";

/**
 * ✅ Embed pour l'annonce de live Kick
 */
export function createLiveEmbed(kickUsername: string): MessageCreateOptions {
  const embed = new EmbedBuilder()
    .setColor(kickGreen)
    .setAuthor({ name: "🎥 Live Kick à la Taverne !", iconURL: kickLogo })
    .setTitle("⚔️ Tata Vertiga est en live !")
    .setURL(`https://kick.com/${kickUsername}`)
    .setDescription(
      `🍺 Ô gueux ! La Taverne a ouvert ses portes et Tata Vertiga est déjà en train de beugler derrière le comptoir !\n[**Rejoins la fête**](https://kick.com/${kickUsername}) et viens t'enfiler une pinte !`
    )
    .setImage(defaultClipImage)
    .setFooter({ text: "Le Tavernier • Live Kick", iconURL: kickLogo })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("🍺 Entrer dans la taverne")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://kick.com/${kickUsername}`)
  );

  return {
    content: `🍺 Mortecouille bande de gueux ! Un live sauvage apparaît sur <@&${liveRoleId}> !`,
    embeds: [embed],
    components: [row],
  };
}

/**
 * ✅ Embed pour un clip Kick
 */
export function createClipEmbed(
  kickUsername: string,
  clipSlug: string,
  clipImage: string,
  auteur: string
): MessageCreateOptions {
  const clipUrl = `https://kick.com/${kickUsername}/clip/${clipSlug}`;

  const embed = new EmbedBuilder()
    .setColor(kickGreen)
    .setAuthor({ name: "🎬 Nouveau clip Kick !", iconURL: kickLogo })
    .setTitle(`Moment épique de la taverne`)
    .setURL(clipUrl)
    .setImage(clipImage || defaultClipImage)
    .setDescription(
      `Une scène digne des chroniques vient d'être figée dans le temps sur **Kick** ! 🏰\n**Auteur :** ${auteur}`
    )
    .setFooter({ text: "Le Tavernier • Clip Kick", iconURL: kickLogo })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("▶️ Voir le clip")
      .setStyle(ButtonStyle.Link)
      .setURL(clipUrl)
  );

  return {
    embeds: [embed],
    components: [row],
  };
}
