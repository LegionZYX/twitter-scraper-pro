/**
 * KOL 识别模块
 * 自动识别高影响力用户
 */

export interface KolProfile {
  username: string;
  displayName: string;
  platform: 'twitter' | 'reddit';
  kolScore: number; // 0-100
  level: 'rising' | 'notable' | 'influential' | 'top';
  metrics: {
    avgEngagement: number;
    postFrequency: number;
    reachScore: number;
    consistencyScore: number;
  };
  categories: string[];
  recentPosts: number;
}

export interface UserActivity {
  username: string;
  displayName: string;
  platform: 'twitter' | 'reddit';
  posts: Array<{
    id: string;
    engagement: number;
    timestamp: number;
    category: string;
  }>;
}

export class KolIdentifier {
  private readonly ENGAGEMENT_WEIGHT = 0.4;
  private readonly FREQUENCY_WEIGHT = 0.3;
  private readonly CONSISTENCY_WEIGHT = 0.2;
  private readonly REACH_WEIGHT = 0.1;

  identify(activities: UserActivity[]): KolProfile[] {
    return activities.map(activity => this.analyzeUser(activity));
  }

  private analyzeUser(activity: UserActivity): KolProfile {
    const metrics = this.calculateMetrics(activity);
    const kolScore = this.calculateKolScore(metrics);
    const level = this.determineLevel(kolScore);
    const categories = this.extractCategories(activity);

    return {
      username: activity.username,
      displayName: activity.displayName,
      platform: activity.platform,
      kolScore: Math.round(kolScore),
      level,
      metrics,
      categories,
      recentPosts: activity.posts.length
    };
  }

  private calculateMetrics(activity: UserActivity): KolProfile['metrics'] {
    if (activity.posts.length === 0) {
      return {
        avgEngagement: 0,
        postFrequency: 0,
        reachScore: 0,
        consistencyScore: 0
      };
    }

    // 平均互动数
    const totalEngagement = activity.posts.reduce((sum, p) => sum + p.engagement, 0);
    const avgEngagement = totalEngagement / activity.posts.length;

    // 发帖频率（每周）
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentPosts = activity.posts.filter(p => p.timestamp > weekAgo).length;
    const postFrequency = recentPosts;

    // 影响力范围（基于最大互动）
    const maxEngagement = Math.max(...activity.posts.map(p => p.engagement));
    const reachScore = Math.min(maxEngagement / 1000 * 100, 100);

    // 一致性（基于发帖时间分布）
    const timestamps = activity.posts.map(p => p.timestamp).sort((a, b) => a - b);
    let consistencyScore = 50;
    if (timestamps.length > 1) {
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      consistencyScore = Math.max(0, 100 - (stdDev / avgInterval) * 50);
    }

    return {
      avgEngagement: Math.round(avgEngagement),
      postFrequency,
      reachScore: Math.round(reachScore),
      consistencyScore: Math.round(consistencyScore)
    };
  }

  private calculateKolScore(metrics: KolProfile['metrics']): number {
    const engagementNormalized = Math.min(metrics.avgEngagement / 1000 * 100, 100);
    const frequencyNormalized = Math.min(metrics.postFrequency * 10, 100);
    
    return (
      engagementNormalized * this.ENGAGEMENT_WEIGHT +
      frequencyNormalized * this.FREQUENCY_WEIGHT +
      metrics.consistencyScore * this.CONSISTENCY_WEIGHT +
      metrics.reachScore * this.REACH_WEIGHT
    );
  }

  private determineLevel(score: number): KolProfile['level'] {
    if (score >= 80) return 'top';
    if (score >= 60) return 'influential';
    if (score >= 40) return 'notable';
    return 'rising';
  }

  private extractCategories(activity: UserActivity): string[] {
    const categoryCount: Record<string, number> = {};
    activity.posts.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
  }

  getTopKols(profiles: KolProfile[], limit: number = 10): KolProfile[] {
    return profiles
      .sort((a, b) => b.kolScore - a.kolScore)
      .slice(0, limit);
  }

  getByCategory(profiles: KolProfile[], category: string): KolProfile[] {
    return profiles.filter(p => p.categories.includes(category));
  }

  getRisingStars(profiles: KolProfile[]): KolProfile[] {
    return profiles.filter(p => p.level === 'rising' && p.kolScore >= 30);
  }
}
