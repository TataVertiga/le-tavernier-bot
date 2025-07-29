import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
dotenv.config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

export async function publierTweetLiveKick(): Promise<void> {
  if (process.env.TWITTER_ENABLED !== 'true') {
    console.log("🚫 Envoi de tweet désactivé dans le .env (TWITTER_ENABLED=false)");
    return;
  }

  try {
	const tweetText = `🎥 Tata Vertiga est EN LIVE sur Kick !  
La taverne s’anime, les gueux s’agitent… Viens mettre le bazar avec nous !  
👉 https://kick.com/${process.env.KICK_USERNAME}`;


    await twitterClient.v2.tweet(tweetText);
    console.log("🐦 ✅ Tweet envoyé avec succès !");
  } catch (error) {
    console.error("🐦 ❌ Erreur lors de l'envoi du tweet :", error);
  }
}
