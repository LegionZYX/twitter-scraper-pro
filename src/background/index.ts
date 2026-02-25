import { syncManager } from '../sync/SyncManager';
import { cleanupOldPosts, startAutoCleanup } from '../sync/cleanup';

// 启动自动同步
syncManager.startAutoSync();

// 启动自动清理
startAutoCleanup();

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message);
  
  if (message.type === 'POSTS_SCRAPED') {
    handlePostsScraped(message.posts).then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // 保持消息通道开启
  }
  
  if (message.type === 'RUN_FILTER') {
    handleRunFilter().then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
  
  if (message.type === 'GET_SYNC_STATUS') {
    const status = syncManager.getStatus();
    sendResponse({ success: true, status });
    return true;
  }
});

async function handlePostsScraped(posts: any[]): Promise<{ success: boolean; count?: number }> {
  console.log(`[Background] Received ${posts.length} posts`);
  
  // 存储到本地（始终可用）
  const current = await chrome.storage.local.get('pendingPosts');
  const pending = current.pendingPosts || [];
  
  await chrome.storage.local.set({
    pendingPosts: [...pending, ...posts],
    syncStatus: 'pending'
  });
  
  // 触发同步检查
  syncManager.syncPendingData();
  
  return { success: true, count: posts.length };
}

async function handleRunFilter(): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // TODO: 实现 LLM 筛选逻辑
  return { success: false, error: 'Not implemented' };
}

console.log('[Background] Service worker started, auto-sync enabled');
