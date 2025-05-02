require('dotenv').config();
const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let lastSeenPost = "";

const SUBREDDITS = ["xbox", "xboxgamepass", "xboxseriess"];
const KEYWORDS = ["india", "indian", "indians"];

const fetchAndNotify = async () => {
  try {
    for (const sub of SUBREDDITS) {
      const res = await axios.get(`https://www.reddit.com/r/${sub}/new.json?limit=5`);
      const posts = res.data.data.children;

      for (const post of posts) {
        const postData = post.data;
        const title = postData.title.toLowerCase();
        const id = postData.id;

        if (id === lastSeenPost) return;

        if (KEYWORDS.some(k => title.includes(k))) {
          console.log("📢 Match found:", title);

          // Send Telegram alert
          await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: `🔔 *Reddit match:*\n${postData.title}\n\n🔗 https://reddit.com${postData.permalink}`,
            parse_mode: "Markdown"
          });

          lastSeenPost = id;
          return;
        }
      }
    }
  } catch (err) {
    console.error("Error during fetch/notify:", err.message);
  }
};

setInterval(fetchAndNotify, 5000); // Every 5 seconds

app.get("/", (req, res) => {
  res.send("✅ Telegram keyword monitor is running.");
});

app.listen(PORT, () => console.log("Server running on port", PORT));
