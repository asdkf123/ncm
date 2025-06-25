export interface NotionNewsEntry {
  title: string;
  description: string;
  url: string;
  source: string;
  keyword: string;
  publishedAt: string;
  scrapedAt: string;
  category: 'news';
}

export interface NotionCafeEntry {
  title: string;
  url: string;
  content: string;
  author: string;
  cafeName: string;
  keyword: string;
  postDate: string;
  scrapedAt: string;
  screenshot?: string;
  category: 'cafe';
}

export type NotionEntry = NotionNewsEntry | NotionCafeEntry;

export interface NotionDatabaseConfig {
  databaseId: string;
  apiKey: string;
}

export interface NotionSaveResult {
  success: boolean;
  entryId?: string;
  error?: string;
  duplicateFound?: boolean;
} 