export type SelectorTier = 'primary' | 'secondary' | 'fallback';

export interface SelectorDefinition {
  tier: SelectorTier;
  css?: string;
  xpath?: string;
  description: string;
  version: string;
}

export type ElementTarget = 
  | 'tweet' 
  | 'author' 
  | 'timestamp' 
  | 'content' 
  | 'engagement'
  | 'avatar'
  | 'media';

export class TweetSelectors {
  private static readonly SELECTORS: Record<ElementTarget, SelectorDefinition[]> = {
    tweet: [
      {
        tier: 'primary',
        css: 'article[data-testid="tweet"]',
        description: 'Standard tweet article element',
        version: '2023-2025'
      },
      {
        tier: 'secondary',
        css: 'article[role="article"]',
        description: 'Tweet via role attribute',
        version: '2023-2025'
      },
      {
        tier: 'fallback',
        css: 'div[data-testid="cellInnerDiv"] article',
        description: 'Nested tweet in cell structure',
        version: '2023-2025'
      }
    ],
    author: [
      {
        tier: 'primary',
        css: '[data-testid="User-Name"]',
        description: 'Username container',
        version: '2023-2025'
      },
      {
        tier: 'secondary',
        css: 'a[href^="/"][role="link"]',
        description: 'Author via link pattern',
        version: '2022-2025'
      },
      {
        tier: 'fallback',
        css: '[data-testid="UserAvatar"]',
        description: 'Avatar container',
        version: '2023-2025'
      }
    ],
    timestamp: [
      {
        tier: 'primary',
        css: 'time[datetime]',
        description: 'Time element with datetime attr',
        version: '2022-2025'
      },
      {
        tier: 'secondary',
        css: 'a[href*="/status/"] time',
        description: 'Time inside status link',
        version: '2023-2025'
      },
      {
        tier: 'fallback',
        css: '[data-testid="timestamp"]',
        description: 'Timestamp testid',
        version: '2024-2025'
      }
    ],
    content: [
      {
        tier: 'primary',
        css: '[data-testid="tweetText"]',
        description: 'Tweet text container',
        version: '2023-2025'
      },
      {
        tier: 'secondary',
        css: 'div[lang]',
        description: 'Language-marked text div',
        version: '2022-2025'
      },
      {
        tier: 'fallback',
        css: '[data-testid="tweet"] div[dir="auto"]',
        description: 'Auto-direction text div',
        version: '2022-2025'
      }
    ],
    engagement: [
      {
        tier: 'primary',
        css: '[data-testid="reply"]',
        description: 'Reply button',
        version: '2023-2025'
      },
      {
        tier: 'secondary',
        css: '[data-testid="retweet"]',
        description: 'Retweet button',
        version: '2023-2025'
      },
      {
        tier: 'fallback',
        css: '[data-testid="like"]',
        description: 'Like button',
        version: '2023-2025'
      }
    ],
    avatar: [
      {
        tier: 'primary',
        css: '[data-testid="Tweet-User-Avatar"] img',
        description: 'User avatar image',
        version: '2023-2025'
      },
      {
        tier: 'secondary',
        css: 'img[src*="profile_images"]',
        description: 'Avatar via profile URL pattern',
        version: '2022-2025'
      },
      {
        tier: 'fallback',
        css: '[data-testid="UserAvatar"] img',
        description: 'User avatar container img',
        version: '2023-2025'
      }
    ],
    media: [
      {
        tier: 'primary',
        css: '[data-testid="tweetPhoto"] img',
        description: 'Tweet photo',
        version: '2023-2025'
      },
      {
        tier: 'secondary',
        css: '[data-testid="videoPlayer"]',
        description: 'Video player',
        version: '2023-2025'
      },
      {
        tier: 'fallback',
        css: '[data-testid="tweet"] img:not([alt=""])',
        description: 'Any non-empty image in tweet',
        version: '2023-2025'
      }
    ]
  };

  static getSelectors(target: ElementTarget): SelectorDefinition[] {
    return this.SELECTORS[target] || [];
  }

  static getPrimary(target: ElementTarget): string {
    return this.SELECTORS[target]?.[0]?.css || '';
  }

  static getAllTargets(): ElementTarget[] {
    return Object.keys(this.SELECTORS) as ElementTarget[];
  }
}
