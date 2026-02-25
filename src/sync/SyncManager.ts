/**
 * SyncManager - 同步管理器
 * 负责检查后端状态、自动同步、错误重试
 */

import { SyncStatus, SyncResult, Post, FilteredPost } from './types';

const BACKEND_HOST = 'http://localhost';
const BACKEND_PORT = 8770;

type StatusChangeListener = (status: SyncStatus) => void;

export class SyncManager {
  private retryCount = 0;
  private maxRetries = 5;
  private checkInterval = 5 * 60 * 1000; // 5 分钟
  private listeners: StatusChangeListener[] = [];
  private currentStatus: SyncStatus = {
    status: 'online',
    lastSync: Date.now(),
    pendingCount: 0,
    retryCount: 0
  };

  /**
   * 检查后端服务状态
   */
  async checkBackendStatus(): Promise<boolean> {
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
   * 获取待同步的帖子
   */
  async getPendingPosts(): Promise<Post[]> {
    const result = await chrome.storage.local.get('pendingPosts');
    return result.pendingPosts || [];
  }

  /**
   * 发送数据到后端
   */
  async sendToBackend(posts: Post[], filtered?: FilteredPost[]): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/api/posts/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          posts,
          filtered: filtered || []
        })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 标记为已同步
   */
  async markAsSynced(posts: Post[]): Promise<void> {
    const result = await chrome.storage.local.get('pendingPosts');
    const pending = result.pendingPosts || [];
    const postIds = new Set(posts.map(p => p.id));
    const remaining = pending.filter((p: Post) => !postIds.has(p.id));
    
    await chrome.storage.local.set({ 
      pendingPosts: remaining,
      syncStatus: remaining.length === 0 ? 'synced' : 'pending'
    });
    
    this.updatePendingCount(remaining.length);
  }

  /**
   * 更新待同步数量
   */
  private async updatePendingCount(count: number) {
    this.currentStatus.pendingCount = count;
    this.notifyListeners();
    
    // 更新 chrome action badge
    if (count > 0) {
      await chrome.action.setBadgeText({ text: String(count) });
      await chrome.action.setBadgeBackgroundColor({ color: '#FFAD1F' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  }

  /**
   * 通知监听器状态变更
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  /**
   * 注册状态变更监听器
   */
  onStatusChange(listener: StatusChangeListener) {
    this.listeners.push(listener);
    // 立即通知当前状态
    listener(this.currentStatus);
  }

  /**
   * 同步待处理数据
   */
  async syncPendingData() {
    const isAvailable = await this.checkBackendStatus();
    
    if (!isAvailable) {
      this.retryCount++;
      this.currentStatus.status = 'offline';
      this.currentStatus.retryCount = this.retryCount;
      this.notifyListeners();
      
      console.log(`[Sync] Backend offline, retry ${this.retryCount}/${this.maxRetries}`);
      return;
    }

    // 后端可用
    const pending = await this.getPendingPosts();
    
    if (pending.length > 0) {
      this.currentStatus.status = 'syncing';
      this.notifyListeners();
      
      const success = await this.sendToBackend(pending);
      
      if (success) {
        await this.markAsSynced(pending);
        this.retryCount = 0;
        this.currentStatus.status = 'online';
        this.currentStatus.lastSync = Date.now();
        console.log(`[Sync] Synced ${pending.length} posts to backend`);
      } else {
        console.log('[Sync] Failed to sync posts');
      }
    } else {
      this.currentStatus.status = 'online';
      this.retryCount = 0;
    }
    
    this.notifyListeners();
  }

  /**
   * 手动触发同步
   */
  async manualSync(): Promise<SyncResult> {
    this.currentStatus.status = 'syncing';
    this.notifyListeners();
    
    const isAvailable = await this.checkBackendStatus();
    
    if (!isAvailable) {
      this.currentStatus.status = 'offline';
      this.notifyListeners();
      return { status: 'failed', remote: false, error: 'Backend unavailable' };
    }

    const pending = await this.getPendingPosts();
    
    if (pending.length === 0) {
      this.currentStatus.status = 'online';
      this.notifyListeners();
      return { status: 'synced', remote: true };
    }

    const success = await this.sendToBackend(pending);
    
    if (success) {
      await this.markAsSynced(pending);
      this.currentStatus.status = 'online';
      this.currentStatus.lastSync = Date.now();
      this.notifyListeners();
      return { status: 'synced', remote: true };
    } else {
      this.currentStatus.status = 'offline';
      this.notifyListeners();
      return { status: 'failed', remote: false, error: 'Sync failed' };
    }
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    console.log('[Sync] Starting auto sync (interval: 5 minutes)');
    
    // 立即执行一次
    this.syncPendingData();
    
    // 定期检查
    setInterval(() => this.syncPendingData(), this.checkInterval);
  }

  /**
   * 获取当前状态
   */
  getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }
}

// 导出单例
export const syncManager = new SyncManager();
