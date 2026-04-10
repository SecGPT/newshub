// ===== Data Models =====

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: number;
  name: string;
  feedUrl: string;
  siteUrl?: string;
  categoryId: number;
  enabled: boolean;
  refreshInterval: number; // 0 = use global default
  lastFetchedAt?: string;
  lastError?: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  title: string;
  link: string;
  pubDate: string;
  sourceId: number;
  categoryId: number;
  fetchedAt: string;
  summary?: string;
  // Joined fields (populated by queries)
  sourceName?: string;
  categoryName?: string;
}

// ===== Settings =====

export interface Settings {
  fetchInterval: number;
  reportTime: string;
  articlesPerSource: number;
  retentionDays: number;
  requestTimeout: number;
  autoFetch: boolean;
  retentionEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  fetchInterval: 30,
  reportTime: "08:00",
  articlesPerSource: 10,
  retentionDays: 30,
  requestTimeout: 10,
  autoFetch: true,
  retentionEnabled: false,
};

// ===== API Request/Response Types =====

export interface ArticlesQuery {
  categoryId?: number;
  sourceId?: number;
  page?: number;
  limit?: number;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FetchResponse {
  fetched: number;
  errors: string[];
}

export interface SourceFormData {
  name: string;
  feedUrl: string;
  siteUrl?: string;
  categoryId: number;
  refreshInterval?: number;
  enabled?: boolean;
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  icon?: string;
  sortOrder?: number;
  enabled?: boolean;
}

export interface ImportItem {
  name: string;
  feedUrl: string;
  siteUrl?: string;
  category: string; // slug or name
}

export interface TestFeedResult {
  valid: boolean;
  title?: string;
  articles: { title: string; link: string; pubDate: string }[];
  error?: string;
}

// ===== Source Colors (for badges) =====

export const CATEGORY_COLORS: Record<string, string> = {
  "news-hot": "bg-red-500",
  "tech-cn": "bg-blue-500",
  "ai-llm": "bg-purple-500",
  "dev-cn": "bg-cyan-500",
  "lifestyle": "bg-green-500",
  "automobile": "bg-yellow-500",
  "motorcycle": "bg-orange-500",
  "ai-research": "bg-indigo-500",
  "ai-products": "bg-teal-500",
  "ai-ethics": "bg-pink-500",
};

export const DEFAULT_CATEGORY_COLOR = "bg-gray-500";
