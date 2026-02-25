/**
 * 发现服务 - 整合所有发现性功能
 */

import { SentimentAnalyzer, SentimentResult } from './SentimentAnalyzer';
import { KolIdentifier, KolProfile, UserActivity } from './KolIdentifier';
import { TrendDetector, TrendingTopic } from './TrendDetector';
import { KeywordAlertManager, KeywordAlert, AlertTrigger } from './KeywordAlertManager';

export interface DiscoveryConfig {
  enableSentiment: boolean;
  enableKolDetection: boolean;
  enableTrendDetection: boolean;
  enableAlerts: boolean;
  minKolScore: number;
  trendThreshold: number;
}

export interface DiscoveryResult {
  sentiments: SentimentResult[];
  kols: KolProfile[];
  trends: TrendingTopic[];
  alerts: AlertTrigger[];
}

export class DiscoveryService {
  private sentimentAnalyzer: SentimentAnalyzer;
  private kolIdentifier: KolIdentifier;
  private trendDetector: TrendDetector;
  private alertManager: KeywordAlertManager;
  private config: DiscoveryConfig;

  constructor(config: Partial<DiscoveryConfig> = {}) {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.kolIdentifier = new KolIdentifier();
    this.trendDetector = new TrendDetector();
    this.alertManager = new KeywordAlertManager();
    
    this.config = {
      enableSentiment: true,
      enableKolDetection: true,
      enableTrendDetection: true,
      enableAlerts: true,
      minKolScore: 40,
      trendThreshold: 30,
      ...config
    };
  }

  /**
   * 分析一批帖子
   */
  analyzePosts(posts: Array<{
    id: string;
    content: string;
    title?: string;
    author: string;
    platform: 'twitter' | 'reddit';
    category?: string;
    engagement: number;
    timestamp: number;
  }>): DiscoveryResult {
    const result: DiscoveryResult = {
      sentiments: [],
      kols: [],
      trends: [],
      alerts: []
    };

    // 1. 情感分析
    if (this.config.enableSentiment) {
      const texts = posts.map(p => `${p.title || ''} ${p.content}`);
      result.sentiments = this.sentimentAnalyzer.batchAnalyze(texts);
    }

    // 2. KOL 识别
    if (this.config.enableKolDetection) {
      const userActivities = this.groupByUser(posts);
      const allKols = this.kolIdentifier.identify(userActivities);
      result.kols = allKols.filter(k => k.kolScore >= this.config.minKolScore);
    }

    // 3. 趋势检测
    if (this.config.enableTrendDetection) {
      const formattedPosts = posts.map(p => ({
        content: `${p.title || ''} ${p.content}`,
        timestamp: p.timestamp,
        category: p.category || 'other'
      }));
      result.trends = this.trendDetector.analyzeTopicFrequency(formattedPosts);
    }

    // 4. 关键词警报
    if (this.config.enableAlerts) {
      posts.forEach(post => {
        const triggers = this.alertManager.checkPost({
          id: post.id,
          content: `${post.title || ''} ${post.content}`,
          title: post.title,
          category: post.category,
          platform: post.platform
        });
        result.alerts.push(...triggers);
      });
    }

    return result;
  }

  private groupByUser(posts: Array<{
    author: string;
    platform: 'twitter' | 'reddit';
    engagement: number;
    timestamp: number;
    category?: string;
  }>): UserActivity[] {
    const userMap = new Map<string, UserActivity>();

    posts.forEach(post => {
      const key = `${post.platform}:${post.author}`;
      const existing = userMap.get(key) || {
        username: post.author,
        displayName: post.author,
        platform: post.platform,
        posts: []
      };

      existing.posts.push({
        id: key + post.timestamp,
        engagement: post.engagement,
        timestamp: post.timestamp,
        category: post.category || 'other'
      });

      userMap.set(key, existing);
    });

    return Array.from(userMap.values());
  }

  /**
   * 获取推荐内容
   */
  getRecommendations(
    posts: Array<{
      id: string;
      content: string;
      title?: string;
      author: string;
      platform: 'twitter' | 'reddit';
      category?: string;
      engagement: number;
      timestamp: number;
    }>,
    userPreferences: {
      categories?: string[];
      minEngagement?: number;
      preferredSentiment?: 'positive' | 'negative' | 'neutral';
    } = {}
  ): Array<{ post: typeof posts[0]; score: number; reason: string }> {
    const sentiments = this.sentimentAnalyzer.batchAnalyze(
      posts.map(p => `${p.title || ''} ${p.content}`)
    );

    const recommendations = posts.map((post, index) => {
      let score = 0;
      const reasons: string[] = [];

      // 互动分数
      if (post.engagement > 1000) {
        score += 30;
        reasons.push('高互动');
      } else if (post.engagement > 100) {
        score += 20;
      }

      // 分类匹配
      if (userPreferences.categories && post.category &&
          userPreferences.categories.includes(post.category)) {
        score += 25;
        reasons.push('匹配兴趣');
      }

      // 情感匹配
      if (userPreferences.preferredSentiment &&
          sentiments[index].sentiment === userPreferences.preferredSentiment) {
        score += 20;
        reasons.push('情感匹配');
      }

      // 时效性
      const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 60 * 60);
      if (hoursSincePost < 6) {
        score += 15;
        reasons.push('最新发布');
      } else if (hoursSincePost < 24) {
        score += 10;
      }

      // 最低互动门槛
      if (userPreferences.minEngagement &&
          post.engagement < userPreferences.minEngagement) {
        score = 0;
      }

      return {
        post,
        score: Math.round(score),
        reason: reasons.join(', ')
      };
    });

    return recommendations
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  /**
   * 添加关键词警报
   */
  addAlert(keywords: string[], options: Partial<KeywordAlert> = {}): KeywordAlert {
    return this.alertManager.addAlert(keywords, options);
  }

  /**
   * 获取所有警报
   */
  getAlerts(): KeywordAlert[] {
    return this.alertManager.getAlerts();
  }

  /**
   * 获取热门趋势
   */
  getTrendingTopics(limit: number = 10): TrendingTopic[] {
    // 需要传入帖子数据，这里提供一个占位方法
    return [];
  }

  /**
   * 获取 KOL 列表
   */
  getTopKols(posts: Array<{
    author: string;
    platform: 'twitter' | 'reddit';
    engagement: number;
    timestamp: number;
    category?: string;
  }>, limit: number = 10): KolProfile[] {
    const activities = this.groupByUser(posts);
    const allKols = this.kolIdentifier.identify(activities);
    return this.kolIdentifier.getTopKols(allKols, limit);
  }

  /**
   * 获取整体情感分析
   */
  getOverallSentiment(posts: Array<{ content: string }>): {
    positive: number;
    negative: number;
    neutral: number;
    dominant: 'positive' | 'negative' | 'neutral';
  } {
    const results = this.sentimentAnalyzer.batchAnalyze(posts.map(p => p.content));
    const overall = this.sentimentAnalyzer.getOverallSentiment(results);
    
    return {
      positive: overall.distribution.positive,
      negative: overall.distribution.negative,
      neutral: overall.distribution.neutral,
      dominant: overall.dominant
    };
  }
}
