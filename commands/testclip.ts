import { Message, TextChannel } from "discord.js";
import { createClipEmbed } from "../embedTemplates.js";
import fs from "fs";
import path from "path";

const lastTestClipFile = path.join(process.cwd(), "last_testclip.json");

// --- Anti-doublon ---
function alreadyNotifiedTestClip(): boolean {
  if (fs.existsSync(lastTestClipFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastTestClipFile, "utf8"));
      if (data.clipId === "test-slug") return true;
    } catch {}
  }
  return false;
}

function markTestClipNotified() {
  fs.writeFileSync(
    lastTestClipFile,
    JSON.stringify({ clipId: "test-slug", time: Date.now() })
  );
}

function resetTestClipMemory() {
  if (fs.existsSync(lastTestClipFile)) {
    fs.unlinkSync(lastTestClipFile);
    console.log("[TESTCLIP] ♻️ Mémoire reset.");
  }
}

export default {
  name: "testclip",
  description: "Envoie un embed de test pour les clips Kick (avec anti-doublon)",

  async execute(message: Message) {
    const kickUsername = process.env.KICK_USERNAME;
    if (!kickUsername) {
      return message.reply("⚠️ `KICK_USERNAME` n'est pas défini dans le `.env`.");
    }

    // --- Vérification anti-doublon ---
    if (alreadyNotifiedTestClip()) {
      return message.reply(
        "⚠️ Un clip test a déjà été envoyé récemment. (Mémoire anti-doublon active)"
      );
    }

    // --- Crée l'embed ---
    const embedPayload = createClipEmbed(
      kickUsername,
      "test-slug",
      "https://i.imgur.com/KbvfR3z.png", // image par défaut
      "Testeur"
    );

    // ✅ Vérifie que le salon est bien textuel
    if (message.channel?.isTextBased()) {
      const channel = message.channel as TextChannel;
      await channel.send(embedPayload); // ⬅️ Envoi direct (pas de destructuration)
      markTestClipNotified();
      await message.reply("✅ Embed de test envoyé !");
    } else {
      await message.reply("⚠️ Impossible d'envoyer l'embed ici.");
    }
  }
};
