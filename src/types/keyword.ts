export interface Keyword {
  id: string;
  term: string;
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordSettings {
  defaultNewsCount: number;
  defaultDateRange: number;
  cronTime: string;
  autoExecution: boolean;
}

export interface KeywordsConfig {
  keywords: Keyword[];
  settings: KeywordSettings;
}

export interface KeywordFormData {
  term: string;
  category: string;
} 