import React from 'react';

interface DiscoveryTabProps {
  tabs: Array<{
    id: string;
    label: string;
    icon: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export function DiscoveryTab({ tabs, activeTab, onTabChange, children }: DiscoveryTabProps) {
  return (
    <div className="discovery-tab">
      <div className="discovery-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`discovery-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      <div className="discovery-tab-content">
        {children}
      </div>
    </div>
  );
}

interface TrendCardProps {
  topic: string;
  heatScore: number;
  growthRate: number;
  postCount: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

export function TrendCard({ topic, heatScore, growthRate, postCount, sentiment, category }: TrendCardProps) {
  const sentimentIcon = {
    positive: '📈',
    negative: '📉',
    neutral: '➡️'
  };

  const heatColor = heatScore >= 70 ? '#E0245E' : heatScore >= 40 ? '#FFAD1F' : '#1DA1F2';

  return (
    <div className="trend-card">
      <div className="trend-header">
        <span className="trend-topic">{topic}</span>
        <span className="trend-sentiment">{sentimentIcon[sentiment]}</span>
      </div>
      <div className="trend-stats">
        <div className="trend-stat">
          <span className="trend-stat-value" style={{ color: heatColor }}>
            {heatScore}
          </span>
          <span className="trend-stat-label">热度</span>
        </div>
        <div className="trend-stat">
          <span className={`trend-stat-value ${growthRate > 0 ? 'positive' : 'negative'}`}>
            {growthRate > 0 ? '+' : ''}{growthRate}%
          </span>
          <span className="trend-stat-label">增长</span>
        </div>
        <div className="trend-stat">
          <span className="trend-stat-value">{postCount}</span>
          <span className="trend-stat-label">帖子</span>
        </div>
      </div>
      <div className="trend-category">{category}</div>
    </div>
  );
}

interface KolCardProps {
  username: string;
  kolScore: number;
  level: 'rising' | 'notable' | 'influential' | 'top';
  categories: string[];
  avgEngagement: number;
  platform: 'twitter' | 'reddit';
}

export function KolCard({ username, kolScore, level, categories, avgEngagement, platform }: KolCardProps) {
  const levelColors = {
    rising: '#17BF63',
    notable: '#1DA1F2',
    influential: '#FFAD1F',
    top: '#E0245E'
  };

  const levelLabels = {
    rising: '🌟 新星',
    notable: '⭐ 知名',
    influential: '🌟 影响力',
    top: '👑 顶级'
  };

  return (
    <div className="kol-card">
      <div className="kol-header">
        <span className="kol-platform">{platform === 'reddit' ? '🤖' : '🐦'}</span>
        <span className="kol-username">@{username}</span>
      </div>
      <div className="kol-level" style={{ backgroundColor: levelColors[level] }}>
        {levelLabels[level]}
      </div>
      <div className="kol-score">
        <span className="score-value">{kolScore}</span>
        <span className="score-label">KOL 指数</span>
      </div>
      <div className="kol-stats">
        <span className="kol-stat">互动：{avgEngagement}</span>
      </div>
      <div className="kol-categories">
        {categories.map((cat, i) => (
          <span key={i} className="kol-category">{cat}</span>
        ))}
      </div>
    </div>
  );
}

interface AlertItemProps {
  alertId: string;
  postId: string;
  matchedKeywords: string[];
  timestamp: number;
  platform: 'twitter' | 'reddit';
}

export function AlertItem({ alertId, postId, matchedKeywords, timestamp, platform }: AlertItemProps) {
  const timeAgo = Math.floor((Date.now() - timestamp) / (1000 * 60));
  const timeText = timeAgo < 60 ? `${timeAgo}分钟前` : `${Math.floor(timeAgo / 60)}小时前`;

  return (
    <div className="alert-item">
      <div className="alert-header">
        <span className="alert-platform">{platform === 'reddit' ? '🤖' : '🐦'}</span>
        <span className="alert-time">{timeText}</span>
      </div>
      <div className="alert-keywords">
        {matchedKeywords.map((kw, i) => (
          <span key={i} className="alert-keyword">{kw}</span>
        ))}
      </div>
      <div className="alert-post-id">{postId}</div>
    </div>
  );
}

interface RecommendationCardProps {
  post: {
    title?: string;
    content: string;
    author: string;
    platform: 'twitter' | 'reddit';
  };
  score: number;
  reason: string;
}

export function RecommendationCard({ post, score, reason }: RecommendationCardProps) {
  return (
    <div className="recommendation-card">
      <div className="rec-header">
        <span className="rec-platform">{post.platform === 'reddit' ? '🤖' : '🐦'}</span>
        <span className="rec-author">@{post.author}</span>
        <span className="rec-score">⭐ {score}</span>
      </div>
      {post.title && <h4 className="rec-title">{post.title}</h4>}
      <p className="rec-content">{post.content.slice(0, 150)}...</p>
      <div className="rec-reason">{reason}</div>
    </div>
  );
}

interface SentimentChartProps {
  positive: number;
  negative: number;
  neutral: number;
}

export function SentimentChart({ positive, negative, neutral }: SentimentChartProps) {
  const total = positive + negative + neutral;
  const positivePct = total > 0 ? (positive / total) * 100 : 0;
  const negativePct = total > 0 ? (negative / total) * 100 : 0;
  const neutralPct = total > 0 ? (neutral / total) * 100 : 0;

  return (
    <div className="sentiment-chart">
      <div className="sentiment-bar">
        <div 
          className="sentiment-segment positive" 
          style={{ width: `${positivePct}%` }}
          title={`正面：${positive} (${positivePct.toFixed(1)}%)`}
        />
        <div 
          className="sentiment-segment negative" 
          style={{ width: `${negativePct}%` }}
          title={`负面：${negative} (${negativePct.toFixed(1)}%)`}
        />
        <div 
          className="sentiment-segment neutral" 
          style={{ width: `${neutralPct}%` }}
          title={`中性：${neutral} (${neutralPct.toFixed(1)}%)`}
        />
      </div>
      <div className="sentiment-legend">
        <span className="legend-item positive">🟢 正面 {positive}</span>
        <span className="legend-item negative">🔴 负面 {negative}</span>
        <span className="legend-item neutral">⚪ 中性 {neutral}</span>
      </div>
    </div>
  );
}
