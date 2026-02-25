/**
 * 热门趋势检测模块
 * 识别讨论热度上升的话题
 */

export interface TrendingTopic {
  topic: string;
  category: string;
  heatScore: number; // 0-100
  growthRate: number; // 增长率 %
  postCount: number;
  timeWindow: '1h' | '6h' | '24h';
  relatedTopics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface KeywordFrequency {
  keyword: string;
  currentCount: number;
  previousCount: number;
  timestamps: number[];
}

export class TrendDetector {
  private keywordHistory = new Map<string, KeywordFrequency>();
  private readonly TIME_WINDOWS = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  };

  extractKeywords(text: string): string[] {
    // 移除常见停用词
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'what',
      'this', 'that', 'these', 'those', 'it', 'its', 'of', 'to', 'in', 'for',
      '我', '的', '了', '是', '在', '和', '有', '就', '都', '而', '及', '与'
    ]);

    // 提取单词（中英文）
    const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    
    // 过滤停用词和短词
    return words
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 10);
  }

  analyzeTopicFrequency(posts: Array<{
    content: string;
    timestamp: number;
    category: string;
  }>): TrendingTopic[] {
    const topicMap = new Map<string, {
      count: number;
      recentCount: number;
      timestamps: number[];
      category: string;
      sentiments: number[];
    }>();

    const now = Date.now();
    const oneHourAgo = now - this.TIME_WINDOWS['1h'];
    const sixHoursAgo = now - this.TIME_WINDOWS['6h'];

    posts.forEach(post => {
      const keywords = this.extractKeywords(post.content);
      
      keywords.forEach(keyword => {
        const existing = topicMap.get(keyword) || {
          count: 0,
          recentCount: 0,
          timestamps: [],
          category: post.category,
          sentiments: []
        };

        existing.count++;
        existing.timestamps.push(post.timestamp);
        
        if (post.timestamp > sixHoursAgo) {
          existing.recentCount++;
        }
        
        if (post.timestamp > oneHourAgo) {
          // 简单情感评分
          const hasPositive = /great|awesome|excellent|amazing|love|breakthrough|革命 | 突破 | 优秀/i.test(post.content);
          const hasNegative = /bad|terrible|awful|horrible|fail|糟糕 | 差 | 失望/i.test(post.content);
          existing.sentiments.push(hasPositive ? 1 : hasNegative ? -1 : 0);
        }

        topicMap.set(keyword, existing);
      });
    });

    // 计算趋势分数
    const trends: TrendingTopic[] = [];
    
    topicMap.forEach((data, topic) => {
      if (data.count < 2) return;

      // 增长率
      const previousPeriod = data.count - data.recentCount;
      const growthRate = previousPeriod > 0 
        ? ((data.recentCount - previousPeriod) / previousPeriod) * 100 
        : data.recentCount * 10;

      // 热度分数
      const heatScore = Math.min(
        (data.recentCount / posts.length) * 100 * (1 + growthRate / 100),
        100
      );

      // 情感倾向
      const avgSentiment = data.sentiments.length > 0
        ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length
        : 0;
      
      let sentiment: TrendingTopic['sentiment'] = 'neutral';
      if (avgSentiment > 0.2) sentiment = 'positive';
      else if (avgSentiment < -0.2) sentiment = 'negative';

      if (heatScore >= 10) {
        trends.push({
          topic,
          category: data.category,
          heatScore: Math.round(heatScore),
          growthRate: Math.round(growthRate),
          postCount: data.recentCount,
          timeWindow: '6h',
          relatedTopics: [],
          sentiment
        });
      }
    });

    // 按热度排序
    return trends.sort((a, b) => b.heatScore - a.heatScore).slice(0, 20);
  }

  detectEmergingTopics(
    currentPosts: Array<{ content: string; timestamp: number; category: string }>,
    historicalPosts: Array<{ content: string; timestamp: number; category: string }>
  ): TrendingTopic[] {
    const currentKeywords = this.getKeywordFrequency(currentPosts);
    const historicalKeywords = this.getKeywordFrequency(historicalPosts);

    const emerging: TrendingTopic[] = [];

    currentKeywords.forEach((current, keyword) => {
      const historical = historicalKeywords.get(keyword) || { count: 0 };
      
      if (current.count >= 3 && historical.count < current.count / 2) {
        const growthRate = historical.count > 0
          ? ((current.count - historical.count) / historical.count) * 100
          : current.count * 100;

        emerging.push({
          topic: keyword,
          category: currentPosts.find(p => this.extractKeywords(p.content).includes(keyword))?.category || 'other',
          heatScore: Math.min(current.count * 10, 100),
          growthRate: Math.round(growthRate),
          postCount: current.count,
          timeWindow: '1h',
          relatedTopics: [],
          sentiment: 'neutral'
        });
      }
    });

    return emerging.sort((a, b) => b.growthRate - a.growthRate).slice(0, 10);
  }

  private getKeywordFrequency(posts: Array<{ content: string }>): Map<string, { count: number }> {
    const frequency = new Map<string, { count: number }>();
    
    posts.forEach(post => {
      const keywords = this.extractKeywords(post.content);
      keywords.forEach(kw => {
        const existing = frequency.get(kw) || { count: 0 };
        existing.count++;
        frequency.set(kw, existing);
      });
    });

    return frequency;
  }

  findRelatedTopics(topics: TrendingTopic[], topic: string, limit: number = 3): string[] {
    // 简单实现：基于共现
    return topics
      .filter(t => t.topic !== topic)
      .slice(0, limit)
      .map(t => t.topic);
  }
}
