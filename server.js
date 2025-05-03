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
      parse_mode: 'Markdown'
    });
    console.log('✅ Sent Telegram message:', res.data.ok);
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error.message);
  }
}

async function fetchSubredditJSON(sub) {
  const url = `https://www.reddit.com/r/${sub}/new.json?limit=5`;

  return axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MonitorB/1.0',
      'Accept': 'application/json',
      'Referer': `https://www.reddit.com/r/${sub}/`,
    }
  });
}

async function checkSubreddits() {
  for (const sub of SUBREDDITS) {
    try {
      const res = await fetchSubredditJSON(sub);
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
