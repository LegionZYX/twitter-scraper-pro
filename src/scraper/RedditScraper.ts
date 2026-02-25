import { Post, Platform } from '../types';

interface RedditAuthorData {
  username: string;
}

interface RedditEngagementData {
  upvotes: number;
  comments: number;
  awards: number;
}

interface RedditPostData {
  id: string;
  title: string;
  content: string;
  author: RedditAuthorData;
  engagement: RedditEngagementData;
  subreddit: string;
  timestamp: string;
  media: string[];
}

export class RedditScraper {
  private readonly platform: Platform = 'reddit';

  scrapePost(element: Element): Post | null {
    try {
      const postData = this.extractPostData(element);
      if (!postData) return null;

      return {
        id: postData.id,
        platform: this.platform,
        author: postData.author.username,
        authorDisplayName: postData.author.username,
        content: postData.content,
        title: postData.title,
        subreddit: postData.subreddit,
        timestamp: postData.timestamp,
        score: postData.engagement.upvotes,
        upvotes: postData.engagement.upvotes,
        downvotes: 0,
        replies: postData.engagement.comments,
        url: this.buildPostUrl(postData.id, postData.subreddit),
        media: postData.media,
        scrapedAt: Date.now(),
      };
    } catch (error) {
      console.error('[RedditScraper] Error scraping post:', error);
      return null;
    }
  }

  private findPostElement(element: Element): Element | null {
    if (element.tagName.toLowerCase() === 'shreddit-post') {
      return element;
    }
    
    if (element.matches?.('shreddit-post, [data-testid="post-container"], article[data-post-id]')) {
      return element;
    }
    
    const post = element.closest?.('shreddit-post') || 
                 element.closest?.('[data-testid="post-container"]') ||
                 element.closest?.('article[data-post-id]');
    
    if (post) return post;
    
    return element.querySelector?.('shreddit-post') || 
           element.querySelector?.('[data-testid="post-container"]') ||
           element.querySelector?.('article[data-post-id]') ||
           null;
  }

  private extractPostData(element: Element): RedditPostData | null {
    const postElement = this.findPostElement(element);
    if (!postElement) {
      console.warn('[RedditScraper] No post element found');
      return null;
    }

    const id = this.extractId(postElement);
    if (!id) {
      console.warn('[RedditScraper] No post ID found');
      return null;
    }

    const title = this.extractTitle(postElement);
    const content = this.extractContent(postElement);
    const author = this.extractAuthor(postElement);
    const engagement = this.extractEngagement(postElement);
    const subreddit = this.extractSubreddit(postElement);
    const timestamp = this.extractTimestamp(postElement);
    const media = this.extractMedia(postElement);

    return {
      id,
      title,
      content,
      author,
      engagement,
      subreddit,
      timestamp,
      media,
    };
  }

  private extractId(element: Element): string {
    const id = element.getAttribute('post-id') ||
               element.getAttribute('data-post-id') ||
               element.getAttribute('data-fullname') ||
               '';
    
    if (id) return id;

    const link = element.querySelector('a[href*="/comments/"]');
    if (link) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/comments\/(\w+)/);
      if (match) return match[1];
    }

    return '';
  }

  private extractTitle(element: Element): string {
    const titleEl = element.querySelector('h3[slot="title"], h3, a[data-click-id="title"], .shreddit-title');
    return titleEl?.textContent?.trim() || '';
  }

  private extractContent(element: Element): string {
    let content = '';
    
    const textEl = element.querySelector('div[data-click-id="text"], .md, .post-content, shreddit-post-text');
    if (textEl) {
      content = textEl.textContent?.trim() || '';
    }
    
    if (!content) {
      const previewEl = element.querySelector('[data-testid="post-preview"], .preview-text');
      if (previewEl) {
        content = previewEl.textContent?.trim() || '';
      }
    }
    
    if (!content) {
      const allText = element.textContent || '';
      const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      if (lines.length > 0) {
        content = lines[0];
      }
    }
    
    return content;
  }

  private extractAuthor(element: Element): RedditAuthorData {
    const authorEl = element.querySelector('a[data-click-id="user"], a[data-click-id="author"], .author, shreddit-author');
    let username = '';
    
    if (authorEl) {
      const href = authorEl.getAttribute('href') || '';
      username = href.replace('/user/', '').replace('/u/', '').split('/')[0];
      
      if (!username) {
        username = authorEl.getAttribute('name') || 
                   authorEl.textContent?.trim() || '';
      }
    }
    
    if (!username) {
      const allLinks = element.querySelectorAll('a[href^="/user/"], a[href^="/u/"]');
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('/user/') || href.startsWith('/u/')) {
          username = href.split('/')[2] || '';
          if (username) break;
        }
      }
    }
    
    return { username: username || '[deleted]' };
  }

  private extractEngagement(element: Element): RedditEngagementData {
    const upvotes = this.extractUpvotes(element);
    const comments = this.extractComments(element);
    const awards = this.extractAwards(element);
    
    return { upvotes, comments, awards };
  }

  private extractUpvotes(element: Element): number {
    const upvoteEl = element.querySelector('button[aria-label*="upvote"], [slot="vote-up"], .score');
    
    if (upvoteEl) {
      const text = upvoteEl.getAttribute('aria-label') || upvoteEl.textContent || '';
      const match = text.match(/(\d+[kKMM]?\d*)/);
      if (match) {
        return this.parseCount(match[1]);
      }
    }
    
    const scoreEl = element.querySelector('[data-click-id="score"], .score, shreddit-post');
    if (scoreEl) {
      const score = scoreEl.getAttribute('score');
      if (score) return parseInt(score, 10);
    }
    
    return 0;
  }

  private extractComments(element: Element): number {
    const commentsEl = element.querySelector('a[data-click-id="comments"], .comments, footer a[href*="/comments/"]');
    
    if (commentsEl) {
      const text = commentsEl.textContent || '';
      const match = text.match(/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    
    return 0;
  }

  private extractAwards(element: Element): number {
    const awardsEl = element.querySelectorAll('shreddit-award, .award, [data-testid="award"]');
    return awardsEl.length;
  }

  private extractSubreddit(element: Element): string {
    const subredditEl = element.querySelector('a[data-click-id="subreddit"], a[href^="/r/"]');
    
    if (subredditEl) {
      const href = subredditEl.getAttribute('href') || '';
      return href.replace('/r/', '').split('/')[0];
    }
    
    return '';
  }

  private extractTimestamp(element: Element): string {
    const timeEl = element.querySelector('time[datetime]');
    if (timeEl) {
      return timeEl.getAttribute('datetime') || '';
    }
    
    const timestampEl = element.querySelector('.timestamp, [data-click-id="timestamp"]');
    if (timestampEl) {
      const text = timestampEl.textContent?.trim() || '';
      if (text) {
        const match = text.match(/(\d+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)/i);
        if (match) {
          const value = parseInt(match[1], 10);
          const unit = match[2].toLowerCase();
          const now = new Date();
          
          if (unit.startsWith('second')) now.setSeconds(now.getSeconds() - value);
          else if (unit.startsWith('minute')) now.setMinutes(now.getMinutes() - value);
          else if (unit.startsWith('hour')) now.setHours(now.getHours() - value);
          else if (unit.startsWith('day')) now.setDate(now.getDate() - value);
          else if (unit.startsWith('week')) now.setDate(now.getDate() - value * 7);
          else if (unit.startsWith('month')) now.setMonth(now.getMonth() - value);
          else if (unit.startsWith('year')) now.setFullYear(now.getFullYear() - value);
          
          return now.toISOString();
        }
      }
    }
    
    return new Date().toISOString();
  }

  private extractMedia(element: Element): string[] {
    const media: string[] = [];
    
    const images = element.querySelectorAll('img[src]:not([src*="avatar"]):not([src*="icon"])');
    images.forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src && src.startsWith('http') && !src.includes('style')) {
        media.push(src);
      }
    });
    
    const videos = element.querySelectorAll('video[src], source[src]');
    videos.forEach(video => {
      const src = video.getAttribute('src') || '';
      if (src && !media.includes(src)) {
        media.push(src);
      }
    });
    
    return media;
  }

  private parseCount(text: string): number {
    const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
    if (cleaned.toLowerCase().includes('k')) {
      const num = parseFloat(cleaned.toLowerCase().replace('k', ''));
      return Math.round(num * 1000);
    }
    if (cleaned.toLowerCase().includes('m')) {
      const num = parseFloat(cleaned.toLowerCase().replace('m', ''));
      return Math.round(num * 1000000);
    }
    return parseInt(cleaned, 10) || 0;
  }

  private buildPostUrl(postId: string, subreddit: string): string {
    return `https://reddit.com/r/${subreddit}/comments/${postId}`;
  }
}
