import { Client, TextChannel } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let lastStatus = false;

export default function kickService(client: Client) {
  async function checkKickLive() {
    try {
      const { data } = await axios.get(`https://kick.com/api/v1/channels/${process.env.KICK_USERNAME}`);
      const isLive = data?.livestream?.is_live;

      if (isLive && !lastStatus) {
        console.log("✅ LIVE détecté via API officielle Kick ! Envoi Discord...");

        const channelId = process.env.CHANNEL_ID!;
        const fetched = await client.channels.fetch(channelId);
        const channel = fetched as TextChannel;

        await channel.send(`:bell: Mortecouille bande de Gueux <@&881684792058466354> TataVertiga lance un live sauvage ! https://kick.com/${process.env.KICK_USERNAME}`);
      }

      if (!isLive && lastStatus) {
        console.log("✅ FIN de LIVE détecté via API officielle Kick !");
      }

      lastStatus = isLive;
    } catch (error: any) {
      console.error("❌ Erreur Kick (API officielle):", error.message);
    }

    setTimeout(checkKickLive, 60_000);
  }

  checkKickLive();
}
