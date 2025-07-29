import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

// Fichier mémoire pour éviter les doublons
const lastTweetFile = path.join(process.cwd(), 'last_tweet.json');

function alreadyTweetedThisLive(): boolean {
  if (fs.existsSync(lastTweetFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lastTweetFile, 'utf8'));
      if (data.liveId === process.env.KICK_USERNAME) {
        return true;
      }
    } catch {}
  }
  return false;
}

function markTweetSent() {
  fs.writeFileSync(
    lastTweetFile,
    JSON.stringify({ liveId: process.env.KICK_USERNAME, time: Date.now() })
  );
}

export function resetTweetMemory() {
  let message = "[TWITTER] ✅ Fin de live → ";
  if (fs.existsSync(lastTweetFile)) {
    fs.unlinkSync(lastTweetFile);
    message += "♻️ Mémoire tweet réinitialisée.";
  } else {
    message += "♻️ Rien à réinitialiser (déjà vide).";
  }
  console.log(message);
}

export async function publierTweetLiveKick(): Promise<void> {
  if (process.env.TWITTER_ENABLED !== 'true') {
    console.log("[TWITTER] 🚫 Envoi désactivé (.env)");
    return;
  }

  if (alreadyTweetedThisLive()) {
    console.log("[TWITTER] ⚠️ Déjà tweeté pour ce live → Pas de doublon.");
    return;
  }

  try {
    const tweetText = `🎥 Tata Vertiga est EN LIVE sur Kick !  
La taverne s’anime, les gueux s’agitent… Viens mettre le bazar avec nous !  
👉 https://kick.com/${process.env.KICK_USERNAME}`;

    await twitterClient.v2.tweet(tweetText);
    console.log("[TWITTER] 🐦 ✅ Tweet envoyé avec succès !");
    markTweetSent();
  } catch (error) {
    console.error("[TWITTER] 🐦 ❌ Erreur envoi tweet :", error);
  }
}
