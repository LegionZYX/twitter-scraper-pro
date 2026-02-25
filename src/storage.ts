import { Storage, Post, FilteredPost, LLMSummary, Settings } from './types';
import { DEFAULT_SETTINGS } from './config';

const STORAGE_KEY = 'social_scraper_v2_data';

export async function getStorage(): Promise<Storage> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY] || {
    posts: [],
    filteredPosts: [],
    summary: null,
    settings: DEFAULT_SETTINGS,
    lastSync: 0,
  };
  
  if (!data.settings || !data.settings.categories) {
    data.settings = DEFAULT_SETTINGS;
  }
  
  return data;
}

export async function setStorage(data: Partial<Storage>): Promise<void> {
  const current = await getStorage();
  await chrome.storage.local.set({
    [STORAGE_KEY]: { ...current, ...data },
  });
}

export async function addPosts(posts: Post[]): Promise<number> {
  const storage = await getStorage();
  const existingIds = new Set(storage.posts.map(p => p.id));
  const newPosts = posts.filter(p => !existingIds.has(p.id));
  
  if (newPosts.length === 0) return 0;
  
  storage.posts.push(...newPosts);
  storage.lastSync = Date.now();
  await setStorage(storage);
  
  return newPosts.length;
}

export async function getPosts(page: number = 1, platform?: string, pageSize?: number): Promise<{ posts: Post[]; total: number; totalPages: number }> {
  const storage = await getStorage();
  const size = pageSize || storage.settings.pageSize || 50;
  
  let allPosts = storage.posts;
  if (platform && platform !== 'all') {
    allPosts = allPosts.filter(p => p.platform === platform);
  }
  
  const total = allPosts.length;
  const totalPages = Math.ceil(total / size);
  const start = (page - 1) * size;
  const end = start + size;
  
  return {
    posts: allPosts.slice(start, end),
    total,
    totalPages: Math.max(1, totalPages)
  };
}

export async function getFilteredPosts(
  page: number = 1, 
  category?: string,
  platform?: string,
  pageSize?: number
): Promise<{ posts: FilteredPost[]; total: number; totalPages: number }> {
  const storage = await getStorage();
  const size = pageSize || storage.settings.pageSize || 50;
  
  let filtered = storage.filteredPosts;
  
  if (platform && platform !== 'all') {
    filtered = filtered.filter(p => p.platform === platform);
  }
  
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  
  const total = filtered.length;
  const totalPages = Math.ceil(total / size);
  const start = (page - 1) * size;
  const end = start + size;
  
  return {
    posts: filtered.slice(start, end),
    total,
    totalPages: Math.max(1, totalPages)
  };
}

export async function clearPosts(): Promise<void> {
  await setStorage({ posts: [], filteredPosts: [], summary: null });
}

export async function getSettings(): Promise<Settings> {
  const storage = await getStorage();
  return storage.settings;
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getStorage();
  await setStorage({
    settings: { ...current.settings, ...settings },
  });
}

export async function saveFilteredResults(
  filtered: FilteredPost[],
  summary: LLMSummary
): Promise<void> {
  await setStorage({ filteredPosts: filtered, summary });
}

export async function getSummary(): Promise<LLMSummary | null> {
  const storage = await getStorage();
  return storage.summary;
}

export async function getStats(): Promise<{ 
  total: number; 
  filtered: number; 
  byCategory: Record<string, number>;
  byPlatform: Record<string, number>;
}> {
  const storage = await getStorage();
  const byCategory: Record<string, number> = {};
  const byPlatform: Record<string, number> = { twitter: 0, reddit: 0 };
  
  storage.filteredPosts.forEach(p => {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
  });
  
  storage.posts.forEach(p => {
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
  });
  
  return {
    total: storage.posts.length,
    filtered: storage.filteredPosts.length,
    byCategory,
    byPlatform
  };
}
