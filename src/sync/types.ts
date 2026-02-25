/**
 * Sync Types - 离线优先架构类型定义
 */

export interface Post {
  id: string;
  platform: 'twitter' | 'reddit';
  author: string;
  authorDisplayName: string;
  content: string;
  title?: string;
  url: string;
  timestamp: string;
  score: number;
  replies: number;
  media: string[];
  scrapedAt: number;
}

export interface FilteredPost extends Post {
  relevanceScore: number;
  category: string;
  reason: string;
  summary?: string;
  keywords?: string[];
}

export interface SyncStatus {
  status: 'online' | 'offline' | 'syncing';
  lastSync: number;
  pendingCount: number;
  retryCount: number;
}

export interface LocalCache {
  posts: Post[];
  filteredPosts: FilteredPost[];
  syncStatus: 'pending' | 'synced' | 'failed';
  lastSync: number;
  pendingCount: number;
}

export interface SyncResult {
  status: 'synced' | 'pending' | 'failed';
  remote: boolean;
  error?: string;
}
