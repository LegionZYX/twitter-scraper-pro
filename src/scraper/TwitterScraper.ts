import { TweetSelectors, SelectorDefinition, ElementTarget } from '../selectors/TweetSelectors';
import { SelectorHealth } from '../selectors/SelectorHealth';

interface AuthorData {
  username: string;
  displayName: string;
}

interface EngagementData {
  replies: number;
  retweets: number;
  likes: number;
}

interface TweetData {
  id: string;
  author: AuthorData;
  content: string;
  timestamp: string;
  engagement: EngagementData;
  media: string[];
}

export class TwitterScraper {
  private health = new SelectorHealth();

  scrapeTweet(element: Element): TweetData | null {
    try {
      const tweetElement = this.findTweetElement(element);
      if (!tweetElement) {
        console.warn('[TwitterScraper] No tweet element found');
        return null;
      }

      const id = this.extractTweetId(tweetElement);
      if (!id) {
        console.warn('[TwitterScraper] No tweet ID found');
        return null;
      }

      const content = this.extractContent(tweetElement);
      const author = this.extractAuthor(tweetElement);
      const timestamp = this.extractTimestamp(tweetElement);
      const engagement = this.extractEngagement(tweetElement);
      const media = this.extractMedia(tweetElement);

      if (!content) {
        console.warn('[TwitterScraper] Empty content for tweet:', id);
      }

      return {
        id,
        author,
        content,
        timestamp,
        engagement,
        media
      };
    } catch (error) {
      console.error('[TwitterScraper] Error scraping tweet:', error);
      return null;
    }
  }

  private findTweetElement(element: Element): Element | null {
    if (element.matches?.('article[data-testid="tweet"]')) {
      return element;
    }
    
    if (element.matches?.('article[role="article"]')) {
      return element;
    }
    
    const nested = element.querySelector('article[data-testid="tweet"]');
    if (nested) return nested;
    
    return element.querySelector('article') || null;
  }

  private findElement(root: Element, target: ElementTarget): Element | null {
    const selectors = TweetSelectors.getSelectors(target);
    
    for (const def of selectors) {
      const element = this.trySelector(root, def);
      if (element) {
        if (def.css) {
          this.health.check(def.css, root);
        }
        return element;
      }
    }
    
    return null;
  }

  private trySelector(root: Element, def: SelectorDefinition): Element | null {
    if (def.css) {
      try {
        const element = root.querySelector(def.css);
        if (element) return element;
      } catch (e) {
        // Invalid selector, skip
      }
    }
    
    if (def.xpath) {
      try {
        const result = document.evaluate(
          def.xpath,
          root,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        if (result.singleNodeValue instanceof Element) {
          return result.singleNodeValue;
        }
      } catch (e) {
        // Invalid xpath, skip
      }
    }
    
    return null;
  }

  private extractTweetId(element: Element): string {
    const link = element.querySelector('a[href*="/status/"]');
    if (link) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
    
    const tweetLink = element.querySelector('[data-testid="tweet"] a, article a[href*="/status/"]');
    if (tweetLink) {
      const href = tweetLink.getAttribute('href') || '';
      const match = href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
    
    return '';
  }

  private extractContent(element: Element): string {
    let content = '';
    
    const primaryEl = element.querySelector('[data-testid="tweetText"]');
    if (primaryEl?.textContent) {
      content = primaryEl.textContent.trim();
    }
    
    if (!content) {
      const langEl = element.querySelector('div[lang]');
      if (langEl?.textContent) {
        content = langEl.textContent.trim();
      }
    }
    
    if (!content) {
      const textElements = element.querySelectorAll('span');
      for (const el of textElements) {
        const text = el.textContent?.trim() || '';
        if (text.length > 20 && !text.startsWith('@') && !text.includes('Replying to')) {
          content = text;
          break;
        }
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

  private extractAuthor(element: Element): AuthorData {
    let username = '';
    let displayName = '';
    
    const userContainer = element.querySelector('[data-testid="User-Name"]');
    if (userContainer) {
      const usernameEl = userContainer.querySelector('a[href^="/"]');
      if (usernameEl) {
        const href = usernameEl.getAttribute('href') || '';
        username = href.replace('/', '').split('/')[0];
      }
      
      const spanEls = userContainer.querySelectorAll('span');
      for (const span of spanEls) {
        const text = span.textContent?.trim() || '';
        if (text && !text.startsWith('@') && text.length > 0 && text.length < 50) {
          displayName = text;
          break;
        }
      }
    }
    
    if (!username) {
      const links = element.querySelectorAll('a[href^="/"]');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('/') && !href.includes('/status/') && !href.includes('reply')) {
          username = href.replace('/', '').split('/')[0];
          if (username) break;
        }
      }
    }
    
    return { username, displayName };
  }

  private extractTimestamp(element: Element): string {
    const timeEl = element.querySelector('time[datetime]');
    if (timeEl) {
      return timeEl.getAttribute('datetime') || '';
    }
    
    const link = element.querySelector('a[href*="/status/"] time');
    if (link) {
      const time = link.closest('time');
      if (time) {
        return time.getAttribute('datetime') || '';
      }
    }
    
    return '';
  }

  private extractEngagement(element: Element): EngagementData {
    return {
      replies: this.parseEngagementCount(element, 'reply'),
      retweets: this.parseEngagementCount(element, 'retweet'),
      likes: this.parseEngagementCount(element, 'like')
    };
  }

  private parseEngagementCount(element: Element, type: string): number {
    const button = element.querySelector(`[data-testid="${type}"]`);
    if (!button) return 0;
    
    const ariaLabel = button.getAttribute('aria-label') || '';
    const match = ariaLabel.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    const spans = button.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent?.trim() || '';
      if (/^\d/.test(text)) {
        return this.parseCount(text);
      }
    }
    
    return 0;
  }

  private parseCount(text: string): number {
    const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
    if (cleaned.includes('K') || cleaned.includes('k')) {
      const num = parseFloat(cleaned.replace(/[Kk]/g, ''));
      return Math.round(num * 1000);
    }
    if (cleaned.includes('M') || cleaned.includes('m')) {
      const num = parseFloat(cleaned.replace(/[Mm]/g, ''));
      return Math.round(num * 1000000);
    }
    return parseInt(cleaned, 10) || 0;
  }

  private extractMedia(element: Element): string[] {
    const media: string[] = [];
    
    const images = element.querySelectorAll('[data-testid="tweetPhoto"] img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src) media.push(src);
    });
    
    if (media.length === 0) {
      const allImages = element.querySelectorAll('img[src*="pbs.twimg.com"], img[src*="twimg.com"]');
      allImages.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.includes('profile_images') && !src.includes('emoji')) {
          media.push(src);
        }
      });
    }
    
    return media;
  }
}
