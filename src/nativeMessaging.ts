/**
 * Native Messaging - 与后端服务通信（支持离线降级）
 */

import { Post, SyncResult } from './sync/types';

const BACKEND_PORT = 8770;
const BACKEND_HOST = 'http://localhost';

/**
 * 检查后端服务状态
 */
export async function checkBackendStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/health`, {
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 批量发送帖子到后端（支持降级到本地存储）
 */
export async function sendBatchToBackend(
  posts: Post[],
  filtered: Post[] = []
): Promise<SyncResult> {
  try {
    const response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/api/posts/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({ posts, filtered })
    });
    
    if (response.ok) {
      return { status: 'synced', remote: true };
    }
  } catch (error) {
    console.log('[NativeMessaging] Backend unavailable, storing locally');
  }
  
  // 降级：存储到 Chrome Storage
  const current = await chrome.storage.local.get('pendingPosts');
  const pending = current.pendingPosts || [];
  
  await chrome.storage.local.set({
    pendingPosts: [...pending, ...posts],
    syncStatus: 'pending'
  });
  
  return { status: 'pending', remote: false };
}

/**
 * 从本地获取待同步帖子
 */
export async function getPendingPosts(): Promise<Post[]> {
  const result = await chrome.storage.local.get('pendingPosts');
  return result.pendingPosts || [];
}

/**
 * 清除已同步的帖子
 */
export async function clearSyncedPosts(postIds: string[]): Promise<void> {
  const result = await chrome.storage.local.get('pendingPosts');
  const pending: Post[] = result.pendingPosts || [];
  const idSet = new Set(postIds);
  const remaining = pending.filter(p => !idSet.has(p.id));
  
  await chrome.storage.local.set({
    pendingPosts: remaining,
    syncStatus: remaining.length === 0 ? 'synced' : 'pending'
  });
}

/**
 * 获取同步状态
 */
export async function getSyncStatus(): Promise<{
  status: 'pending' | 'synced' | 'failed';
  pendingCount: number;
  lastSync: number;
}> {
  const result = await chrome.storage.local.get(['syncStatus', 'pendingPosts', 'lastSync']);
  return {
    status: result.syncStatus || 'synced',
    pendingCount: (result.pendingPosts || []).length,
    lastSync: result.lastSync || 0
  };
}
