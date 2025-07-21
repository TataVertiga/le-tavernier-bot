// services/tiktok.js
const Parser = require("rss-parser");
const parser = new Parser();

const CHANNEL_ID_TIKTOK = "845579568488251412";
const ROLE_TIKTOK = "<@&881684898732187668>";
let lastTikTok = "";

async function checkTikTok(client) {
  try {
    const feed = await parser.parseURL("https://www.tiktok.com/@tata.vertiga/rss");
    const latest = feed.items[0];

    if (latest && latest.link !== lastTikTok) {
      const channel = await client.channels.fetch(CHANNEL_ID_TIKTOK);
      await channel.send(`🎵 Tata balance du TikTok les joyeux gueux ! ${ROLE_TIKTOK} ➡️ ${latest.link}`);
      lastTikTok = latest.link;
    }
  } catch (err) {
    console.error("Erreur TikTok:", err.message);
  }
}

module.exports = { checkTikTok };
