const snoowrap = require('snoowrap');
require('dotenv').config();

const monitoredSubs = ['xbox', 'xboxseriess', 'xboxgamepass'];
const keywords = ['india', 'indian', 'indians'];
const seenPostIds = new Set();

const r = new snoowrap({
  userAgent: 'reddit-monitor-script',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN
});

async function checkSubreddit(subreddit) {
  try {
    const posts = await r.getSubreddit(subreddit).getNew({ limit: 10 });
    for (const post of posts) {
      if (!seenPostIds.has(post.id)) {
        const content = `${post.title} ${post.selftext}`.toLowerCase();
        if (keywords.some(k => content.includes(k))) {
          console.log(`[MATCH] r/${subreddit} - ${post.title} (${post.url})`);
        }
        seenPostIds.add(post.id);
      }
    }
  } catch (err) {
    console.error(`❌ Error checking /r/${subreddit}:`, err.message);
  }
}

async function monitor() {
  for (const sub of monitoredSubs) {
    await checkSubreddit(sub);
  }
}

setInterval(monitor, 60 * 1000); // every 60 seconds
console.log("✅ Reddit keyword monitor started.");
