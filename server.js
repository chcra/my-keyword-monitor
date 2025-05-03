require('dotenv').config();
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;


const SUBREDDITS = ["xbox", "xboxgamepass", "xboxseriess"];
const KEYWORDS = ["india", "indian", "indians"];


let lastSeen = {};

async function sendTelegramMessage(text) {
  try {
    const res = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
    });
    console.log('✅ Sent Telegram message:', res.data.ok);
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error.message);
  }
}

async function checkSubreddits() {
  for (const sub of SUBREDDITS) {
    try {
      const res = await axios.get(`https://www.reddit.com/r/${sub}/new.json?limit=5`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RedditKeywordMonitor/1.0; +https://github.com/yourusername)'
        }
      });

      const posts = res.data.data.children;

      for (const post of posts) {
        const { id, title, permalink } = post.data;
        if (lastSeen[sub] === id) break;

        const lower = title.toLowerCase();
        if (KEYWORDS.some(word => lower.includes(word))) {
          const link = `https://reddit.com${permalink}`;
          await sendTelegramMessage(`📣 *Match in r/${sub}*:\n${title}\n${link}`);
        }
      }

      if (posts.length > 0) lastSeen[sub] = posts[0].data.id;
    } catch (err) {
      console.error(`❌ Error checking /r/${sub}:`, err.response?.data || err.message);
    }
  }
}

setInterval(checkSubreddits, 15000); // every 15 seconds
checkSubreddits();
