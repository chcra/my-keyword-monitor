const axios = require("axios");

// Load .env if running locally (Render handles this automatically)
require("dotenv").config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const SUBREDDITS = ["xbox", "xboxgamepass", "xboxseriess"];
const KEYWORDS = ["india", "indian", "indians"];

let seenPostIds = new Set();

async function sendTelegramMessage(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    };
    const response = await axios.post(url, payload);
    console.log("✅ Sent Telegram message:", response.data.ok);
  } catch (err) {
    console.error("❌ Error sending Telegram message:", err.response?.data || err.message);
  }
}

async function checkSubreddits() {
  for (const sub of SUBREDDITS) {
    try {
      const res = await axios.get(`https://www.reddit.com/r/${sub}/new.json?limit=5`);
      const posts = res.data.data.children;

      for (const post of posts) {
        const { id, title, permalink } = post.data;
        const lowerTitle = title.toLowerCase();

        if (!seenPostIds.has(id) && KEYWORDS.some(kw => lowerTitle.includes(kw))) {
          const link = `https://reddit.com${permalink}`;
          await sendTelegramMessage(`🔔 <b>${title}</b>\n${link}`);
          seenPostIds.add(id);
        }
      }
    } catch (err) {
      console.error(`❌ Error checking /r/${sub}:`, err.response?.data || err.message);
    }
  }
}

// Initial test message to confirm it's working
(async () => {
  await sendTelegramMessage("✅ Telegram keyword monitor started!");
})();

// Check every 60 seconds
setInterval(checkSubreddits, 60 * 1000);
