/**
 * 数据清理策略
 * 定期清理旧数据，防止 Chrome Storage 超出 10MB 限制
 */

import { Post } from './types';

const CLEANUP_DAYS = 90; // 保留 90 天数据
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 每天检查一次

/**
 * 清理超过指定天数的帖子
 */
export async function cleanupOldPosts(days: number = CLEANUP_DAYS): Promise<number> {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  const cache = await chrome.storage.local.get(['posts', 'pendingPosts']);
  const posts: Post[] = cache.posts || [];
  const pendingPosts: Post[] = cache.pendingPosts || [];
  
  // 清理已同步的旧帖子（保留待同步的，不管多旧）
  const pendingIds = new Set(pendingPosts.map(p => p.id));
  const filtered = posts.filter(p => {
    // 保留待同步的帖子
    if (pendingIds.has(p.id)) return true;
    // 保留最近的帖子
    return p.scrapedAt > cutoff;
  });
  
  const cleanedCount = posts.length - filtered.length;
  
  if (cleanedCount > 0) {
    await chrome.storage.local.set({ posts: filtered });
    console.log(`[Cleanup] Cleaned ${cleanedCount} old posts (kept ${filtered.length})`);
  }
  
  return cleanedCount;
}

/**
 * 获取存储使用量统计
 */
export async function getStorageStats(): Promise<{
  totalPosts: number;
  pendingPosts: number;
  estimatedSize: number;
  daysOfData: number;
}> {
  const cache = await chrome.storage.local.get(['posts', 'pendingPosts']);
  const posts: Post[] = cache.posts || [];
  const pendingPosts: Post[] = cache.pendingPosts || [];
  
  // 估算大小（简单估算：每个帖子约 1KB）
  const estimatedSize = (posts.length + pendingPosts.length) * 1024;
  
  // 计算数据跨度
  const oldestPost = posts.length > 0 
    ? Math.min(...posts.map(p => p.scrapedAt))
    : Date.now();
  
  const daysOfData = Math.floor((Date.now() - oldestPost) / (24 * 60 * 60 * 1000));
  
  return {
    totalPosts: posts.length,
    pendingPosts: pendingPosts.length,
    estimatedSize,
    daysOfData
  };
}

/**
 * 启动定期清理任务
 */
export function startAutoCleanup() {
  console.log(`[Cleanup] Starting auto cleanup (check interval: 24h, retention: ${CLEANUP_DAYS} days)`);
  
  // 立即执行一次
  cleanupOldPosts();
  
  // 每天检查一次
  setInterval(() => cleanupOldPosts(), CHECK_INTERVAL);
}
