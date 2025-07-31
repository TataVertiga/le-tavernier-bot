import { Message, TextChannel } from "discord.js";
import { createClipEmbed } from "../embedTemplates.js";

export default {
  name: "testclip",
  description: "Envoie un embed de test pour les clips Kick",

  async execute(message: Message) {
    const kickUsername = process.env.KICK_USERNAME;
    if (!kickUsername) {
      return message.reply("⚠️ `KICK_USERNAME` n'est pas défini dans le `.env`.");
    }

    // --- Crée l'embed ---
    const embedPayload = createClipEmbed(
      kickUsername,
      "test-slug",
      "https://i.imgur.com/KbvfR3z.png", // Image par défaut
      "Testeur"
    );

    // ✅ Vérifie que le salon est bien textuel
    if (message.channel?.isTextBased()) {
      const channel = message.channel as TextChannel;
      await channel.send(embedPayload); // Envoi direct de l'embed
      await message.reply("✅ Embed de test envoyé !");
    } else {
      await message.reply("⚠️ Impossible d'envoyer l'embed ici.");
    }
  }
};
