export interface NewsItem {
  title: string;
  description: string;
  originallink: string;
  link: string;
  pubDate: string;
  keyword: string;
  source: string;
  scrapedAt: Date;
}

export interface CafePost {
  title: string;
  url: string;
  content: string;
  author: string;
  cafeName: string;
  postDate: string;
  keyword: string;
  screenshot?: string; // base64 or file path
  screenshotPath?: string; // 로컬 파일 경로
  imgurUrl?: string; // imgur 업로드 URL
  scrapedAt: Date;
}

export interface ScrapingResult {
  keyword: string;
  news: NewsItem[];
  cafePosts: CafePost[];
  totalItems: number;
  startTime: Date;
  endTime: Date;
  success: boolean;
  error?: string;
}

export interface ScrapingConfig {
  mode: 'safe' | 'normal' | 'urgent' | 'fast';
  delayRange: {
    min: number;
    max: number;
  };
  maxItemsPerHour: number;
  humanPatterns: {
    enableMouseMovement: boolean;
    enableMistakePattern: boolean;
    enableReadingPattern: boolean;
  };
}

export interface BrowserSession {
  sessionId: string;
  isActive: boolean;
  lastActivity: Date;
  debugPort: number;
  userAgent: string;
}

export type NaverDateOption = 'all' | '1h' | '1d' | '1w' | '1m' | '3m' | '6m' | '1y'; 