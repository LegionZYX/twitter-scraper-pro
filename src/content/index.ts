import { DOMWatcher } from '../core/DOMWatcher';
import { TwitterScraper } from '../scraper/TwitterScraper';
import { RedditScraper } from '../scraper/RedditScraper';
import { Post } from '../types';

let currentPlatform: 'twitter' | 'reddit' = 'twitter';
const twitterScraper = new TwitterScraper();
const redditScraper = new RedditScraper();
let watcher: DOMWatcher | null = null;

function detectPlatform(): 'twitter' | 'reddit' {
  if (location.hostname.includes('reddit.com')) {
    return 'reddit';
  }
  return 'twitter';
}

function init(): void {
  currentPlatform = detectPlatform();
  console.log(`[SocialScraper] Initializing on ${currentPlatform}...`);
  
  let timeline: Element;
  let selector: string;
  
  if (currentPlatform === 'reddit') {
    timeline = document.querySelector('main, #SHORTCUT_FOCUSABLE_DIV') || document.body;
    selector = 'shreddit-post, [data-testid="post-container"], article[data-post-id]';
  } else {
    timeline = document.querySelector('[data-testid="primaryColumn"], main') || document.body;
    selector = 'article[data-testid="tweet"], article[role="article"]';
  }

  watcher = new DOMWatcher(
    timeline as Node,
    async () => {
      const posts = scrapeVisiblePosts();
      if (posts.length > 0) {
        console.log(`[SocialScraper] Scraped ${posts.length} posts on ${currentPlatform}`);
        chrome.runtime.sendMessage({
          type: 'POSTS_SCRAPED',
          posts,
        }).catch(err => console.warn('[SocialScraper] Failed to send posts:', err));
      }
    },
    { 
      debounceMs: 500, 
      selector,
      childList: true,
      subtree: true 
    }
  );

  watcher.start();
  
  setTimeout(() => {
    const initialPosts = scrapeVisiblePosts();
    if (initialPosts.length > 0) {
      console.log(`[SocialScraper] Initial scrape: ${initialPosts.length} posts`);
      chrome.runtime.sendMessage({
        type: 'POSTS_SCRAPED',
        posts: initialPosts,
      }).catch(err => console.warn('[SocialScraper] Failed to send initial posts:', err));
    }
  }, 1000);
}

function scrapeVisiblePosts(): Post[] {
  let postElements: NodeListOf<Element>;
  
  if (currentPlatform === 'reddit') {
    postElements = document.querySelectorAll('shreddit-post, [data-testid="post-container"], article[data-post-id]');
  } else {
    postElements = document.querySelectorAll('article[data-testid="tweet"], article[role="article"]');
  }
  
  const posts: Post[] = [];
  const seen = new Set<string>();

  postElements.forEach(el => {
    try {
      let data: Post | null;
      
      if (currentPlatform === 'reddit') {
        data = redditScraper.scrapePost(el);
      } else {
        const tweetData = twitterScraper.scrapeTweet(el);
        if (tweetData) {
          data = {
            id: tweetData.id,
            platform: 'twitter',
            author: tweetData.author.username,
            authorDisplayName: tweetData.author.displayName,
            content: tweetData.content,
            timestamp: tweetData.timestamp,
            score: tweetData.engagement.likes,
            replies: tweetData.engagement.replies,
            url: buildPostUrl(tweetData.id, 'twitter', tweetData.author.username),
            media: tweetData.media,
            scrapedAt: Date.now(),
          };
        } else {
          data = null;
        }
      }
      
      if (data && data.id && !seen.has(data.id)) {
        seen.add(data.id);
        posts.push(data);
      }
    } catch (err) {
      console.warn(`[SocialScraper] Failed to scrape post:`, err);
    }
  });

  return posts;
}

function buildPostUrl(id: string, platform: string, username?: string): string {
  if (platform === 'twitter') {
    const handle = username || 'i';
    return `https://twitter.com/${handle}/status/${id}`;
  }
  return `https://reddit.com/r/?comments/${id}`;
}

function cleanup(): void {
  watcher?.destroy();
  watcher = null;
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    cleanup();
    setTimeout(init, 500);
  }
}).observe(document.body, { childList: true, subtree: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('beforeunload', cleanup);
