/**
 * 关键词警报模块
 * 特定关键词出现时通知用户
 */

export interface KeywordAlert {
  id: string;
  keywords: string[];
  action: 'notify' | 'highlight' | 'save';
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  categories?: string[];
  platforms?: ('twitter' | 'reddit')[];
  createdAt: number;
  triggeredCount: number;
}

export interface AlertTrigger {
  alertId: string;
  postId: string;
  matchedKeywords: string[];
  timestamp: number;
  platform: 'twitter' | 'reddit';
}

export class KeywordAlertManager {
  private alerts: KeywordAlert[] = [];
  private triggers: AlertTrigger[] = [];

  addAlert(keywords: string[], options: Partial<KeywordAlert> = {}): KeywordAlert {
    const alert: KeywordAlert = {
      id: `alert_${Date.now()}`,
      keywords: keywords.map(k => k.toLowerCase()),
      action: options.action || 'notify',
      enabled: options.enabled ?? true,
      priority: options.priority || 'medium',
      categories: options.categories,
      platforms: options.platforms,
      createdAt: Date.now(),
      triggeredCount: 0
    };

    this.alerts.push(alert);
    return alert;
  }

  removeAlert(alertId: string): boolean {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      this.alerts.splice(index, 1);
      return true;
    }
    return false;
  }

  updateAlert(alertId: string, updates: Partial<KeywordAlert>): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      Object.assign(alert, updates);
      return true;
    }
    return false;
  }

  checkPost(post: {
    id: string;
    content: string;
    title?: string;
    category?: string;
    platform: 'twitter' | 'reddit';
  }): AlertTrigger[] {
    const text = `${post.title || ''} ${post.content}`.toLowerCase();
    const triggers: AlertTrigger[] = [];

    this.alerts.forEach(alert => {
      if (!alert.enabled) return;
      
      // 检查分类
      if (alert.categories && post.category && !alert.categories.includes(post.category)) {
        return;
      }

      // 检查平台
      if (alert.platforms && !alert.platforms.includes(post.platform)) {
        return;
      }

      const matched = alert.keywords.filter(k => text.includes(k));
      
      if (matched.length > 0) {
        triggers.push({
          alertId: alert.id,
          postId: post.id,
          matchedKeywords: matched,
          timestamp: Date.now(),
          platform: post.platform
        });

        alert.triggeredCount++;
      }
    });

    this.triggers.push(...triggers);
    return triggers;
  }

  getAlerts(): KeywordAlert[] {
    return this.alerts;
  }

  getEnabledAlerts(): KeywordAlert[] {
    return this.alerts.filter(a => a.enabled);
  }

  getRecentTriggers(limit: number = 10): AlertTrigger[] {
    return this.triggers
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  exportAlerts(): string {
    return JSON.stringify(this.alerts, null, 2);
  }

  importAlerts(json: string): boolean {
    try {
      const imported = JSON.parse(json) as KeywordAlert[];
      this.alerts = [...this.alerts, ...imported];
      return true;
    } catch {
      return false;
    }
  }

  getPredefinedAlerts(): Array<{ name: string; keywords: string[]; description: string }> {
    return [
      {
        name: '🚀 产品发布',
        keywords: ['launch', 'release', 'announce', 'new product', 'coming soon', '发布', '新品', '预告'],
        description: '新产品发布和预告'
      },
      {
        name: '💰 融资信息',
        keywords: ['funding', 'investment', 'raised', 'series a', 'series b', 'ipo', '融资', '投资', '上市'],
        description: '融资和投资信息'
      },
      {
        name: '🔧 技术教程',
        keywords: ['tutorial', 'guide', 'how to', 'learn', 'course', '教程', '指南', '学习'],
        description: '技术教程和学习资源'
      },
      {
        name: '📊 数据报告',
        keywords: ['report', 'research', 'study', 'survey', 'data', '报告', '研究', '数据'],
        description: '研究报告和数据分析'
      },
      {
        name: '⚡ 突发新闻',
        keywords: ['breaking', 'urgent', 'just in', 'update', '突发', '快讯', '最新'],
        description: '突发新闻和重要更新'
      },
      {
        name: '💼 工作机会',
        keywords: ['hiring', 'job', 'career', 'position', 'opening', '招聘', '工作', '职位'],
        description: '招聘和职业机会'
      }
    ];
  }
}
