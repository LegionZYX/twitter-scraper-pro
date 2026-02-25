export type Platform = 'twitter' | 'reddit';

export interface DeepFilterResponse {
  isRelevant: boolean;
  relevanceScore: number;
  category: string;
  subCategory?: string;
  reason: string;
  summary?: string;
  keywords?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
  enabled: boolean;
  order: number;
}

export type FilterLevel = 'normal' | 'deep' | 'custom';

export interface Post {
  id: string;
  platform: Platform;
  author: string;
  authorDisplayName: string;
  content: string;
  title?: string;
  subreddit?: string;
  timestamp: string;
  score: number;
  upvotes?: number;
  downvotes?: number;
  replies: number;
  url: string;
  media: string[];
  scrapedAt: number;
}

export interface FilteredPost extends Post {
  relevanceScore: number;
  category: string;
  subCategory?: string;
  reason: string;
  summary?: string;
  keywords?: string[];
}

export interface LLMSummary {
  totalAnalyzed: number;
  relevantCount: number;
  categories: Record<string, number>;
  keyTopics: string[];
  summary: string;
  topPosts: string[];
  generatedAt: number;
}

export interface Settings {
  llmProvider: 'zhipu' | 'deepseek' | 'openai' | 'anthropic';
  apiKey: string;
  apiEndpoint?: string;
  model: string;
  filterLevel: FilterLevel;
  customPrompt: string;
  categories: Category[];
  minRelevanceScore: number;
  pageSize: number;
  autoFilter: boolean;
}

export interface Storage {
  posts: Post[];
  filteredPosts: FilteredPost[];
  summary: LLMSummary | null;
  settings: Settings;
  lastSync: number;
  discovery?: {
    trends?: any[];
    kols?: any[];
    alerts?: any[];
  };
}
