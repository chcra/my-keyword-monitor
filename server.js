
require('dotenv').config();
const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

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
          console.log("🔔 Match found:", title);

          // Send pushover notification
          await axios.post("https://api.pushover.net/1/messages.json", null, {
            params: {
              token: process.env.PUSHOVER_APP_TOKEN,
              user: process.env.PUSHOVER_USER_KEY,
              title: "Reddit Keyword Match",
              message: title,
              url: "https://reddit.com" + postData.permalink,
              url_title: "View on Reddit"
            }
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

setInterval(fetchAndNotify, 59000); // check every 59 seconds

app.get("/", (req, res) => {
  res.send("✅ Reddit keyword monitor is running.");
});

app.listen(PORT, () => console.log("Server running on port", PORT));
