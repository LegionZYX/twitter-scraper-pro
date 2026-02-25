import { Post, FilteredPost, LLMSummary } from './types';

function escapeCSV(value: string | number): string {
  const str = String(value || '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(timestamp: string | number): string {
  try {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function exportPostsToCSV(posts: Post[]): string {
  const BOM = '\uFEFF';
  const headers = ['平台', 'ID', '作者', '标题', '内容', '子版块', '时间', '点赞', '评论', '链接', '抓取时间'];
  
  const rows = posts.map(p => [
    escapeCSV(p.platform),
    escapeCSV(p.id),
    escapeCSV(p.author),
    escapeCSV(p.title || ''),
    escapeCSV(p.content),
    escapeCSV(p.subreddit || ''),
    escapeCSV(formatDate(p.timestamp)),
    escapeCSV(p.upvotes || p.score),
    escapeCSV(p.replies),
    escapeCSV(p.url),
    escapeCSV(formatDate(p.scrapedAt)),
  ]);

  return BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportFilteredToCSV(filtered: FilteredPost[]): string {
  const BOM = '\uFEFF';
  const headers = ['平台', 'ID', '作者', '标题', '内容', '子版块', '时间', '相关度', '分类', '筛选原因', '摘要', '点赞', '评论', '链接'];
  
  const rows = filtered.map(p => [
    escapeCSV(p.platform),
    escapeCSV(p.id),
    escapeCSV(p.author),
    escapeCSV(p.title || ''),
    escapeCSV(p.content),
    escapeCSV(p.subreddit || ''),
    escapeCSV(formatDate(p.timestamp)),
    escapeCSV(p.relevanceScore),
    escapeCSV(p.category),
    escapeCSV(p.reason),
    escapeCSV(p.summary || ''),
    escapeCSV(p.upvotes || p.score),
    escapeCSV(p.replies),
    escapeCSV(p.url),
  ]);

  return BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportSummaryToCSV(summary: LLMSummary): string {
  const BOM = '\uFEFF';
  const lines = [
    '分析报告',
    `生成时间,${formatDate(summary.generatedAt)}`,
    `分析帖子数,${summary.totalAnalyzed}`,
    `相关帖子数,${summary.relevantCount}`,
    '',
    '分类统计',
    ...Object.entries(summary.categories).map(([k, v]) => `${k},${v}`),
    '',
    '关键主题',
    ...summary.keyTopics.map(t => t),
    '',
    '摘要',
    summary.summary,
  ];

  return BOM + lines.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAll(
  posts: Post[],
  filtered: FilteredPost[],
  summary: LLMSummary | null
): void {
  const timestamp = new Date().toISOString().slice(0, 10);
  
  downloadCSV(exportPostsToCSV(posts), `social_posts_raw_${timestamp}.csv`);
  
  if (filtered.length > 0) {
    setTimeout(() => {
      downloadCSV(exportFilteredToCSV(filtered), `social_posts_filtered_${timestamp}.csv`);
    }, 500);
  }
  
  if (summary) {
    setTimeout(() => {
      downloadCSV(exportSummaryToCSV(summary), `social_posts_summary_${timestamp}.csv`);
    }, 1000);
  }
}
