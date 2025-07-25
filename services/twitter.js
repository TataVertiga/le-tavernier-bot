const { TwitterApi } = require('twitter-api-v2');

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function publierTweetLiveKick() {
  try {
    await twitterClient.v2.tweet("🎥 Le live Kick commence ! Rejoins la Taverne : https://kick.com/tatavertiga");
    console.log("✅ Tweet envoyé !");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du tweet :", error);
  }
}

module.exports = { publierTweetLiveKick };
