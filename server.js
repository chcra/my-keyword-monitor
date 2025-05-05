const express = require('express');
const snoowrap = require('snoowrap');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== Minimal web server to keep Render free tier awake ======
app.get('/', (req, res) => res.send('Reddit keyword monitor is running.'));
app.get('/healthz', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// ====== Reddit + Telegram Monitor ======
const r = new snoowrap({
  userAgent: 'reddit-keyword-monitor',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const subreddits = ['xbox', 'xboxseriess', 'xboxgamepass'];
const keywords = ['india', 'indian', 'indians'];
const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');

const seen = new Set();

async function checkPosts() {
  for (const subreddit of subreddits) {
    try {
      const posts = await r.getSubreddit(subreddit).getNew({ limit: 10 });

      for (const post of posts) {
        const id = post.id;
        if (seen.has(id)) continue;

        const title = post.title || '';
        const selftext = post.selftext || '';
        if (keywordRegex.test(title) || keywordRegex.test(selftext)) {
          const message = `[MATCH] r/${subreddit} - ${title}\n${post.url}`;
          console.log(message);

          // Send Telegram alert
          if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
            try {
              await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: TELEGRAM_CHAT_ID,
                  text: message
                }),
              });
              console.log('✅ Telegram alert sent.');
            } catch (err) {
              console.error('❌ Telegram send failed:', err.message);
            }
          } else {
            console.log('⚠️ Telegram credentials not set.');
          }
        }

        seen.add(id);
      }
    } catch (err) {
      console.error(`❌ Failed to check r/${subreddit}:`, err.message);
    }
  }
}

// Start the scan loop
setInterval(checkPosts, 30 * 1000); // Every 30 seconds
console.log('✅ Reddit keyword monitor started.');
