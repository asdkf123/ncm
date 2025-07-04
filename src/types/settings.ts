export interface ApiSettings {
  naverClientId: string;
  naverClientSecret: string;
  notionApiKey: string;
  notionDatabaseId: string;
}

export interface ChromeSettings {
  debugPort: number;
  debugHost: string;
  userDataDir: string;
}

// 네이버 검색 기간 옵션 타입
export type NaverDateOption = 'all' | '1h' | '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'custom';

// 커스텀 날짜 범위 인터페이스
export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD 형식
  endDate: string;   // YYYY-MM-DD 형식
}

// 기간 설정 모드
export type DateRangeMode = 'preset' | 'custom';

export interface PeriodSettings {
  scrapingDateRange: number; // 스크래핑할 뉴스의 날짜 범위 (일) - 기존 호환성용
  naverDateOption: NaverDateOption; // 네이버 검색 기간 옵션 (전체, 1시간, 1일, 1주, 1개월, 3개월, 6개월, 1년, 직접입력)
  statisticsDateRange: 'today' | 'week' | 'month' | 'custom'; // 통계 표시 기간
  customStartDate?: string; // 커스텀 기간 시작일 (YYYY-MM-DD)
  customEndDate?: string; // 커스텀 기간 종료일 (YYYY-MM-DD)
  // 카페 검색 전용 커스텀 날짜 범위
  cafeCustomRange?: CustomDateRange;
}

export interface ScrapingSettings {
  newsCount: number; // 키워드당 수집할 뉴스 개수
  cafeCount: number; // 키워드당 수집할 카페글 개수
  cafeEnabled: boolean; // 카페 수집 활성화 여부
}

export interface AppSettings {
  api: ApiSettings;
  chrome: ChromeSettings;
  period: PeriodSettings;
  scraping: ScrapingSettings;
  updatedAt: Date;
}

export interface SettingsFormData {
  naverClientId: string;
  naverClientSecret: string;
  notionApiKey: string;
  notionDatabaseId: string;
}

/**
 * UI의 dateRange 값을 네이버 date_option으로 변환
 * UI option 값 -> 네이버 date_option 매핑
 */
export function dateRangeToNaverOption(dateRange: number): NaverDateOption {
  // UI의 select option 값과 네이버 date_option 매핑
  if (dateRange <= 1/24) return '1h';      // 1시간
  if (dateRange <= 1) return '1d';         // 1일  
  if (dateRange <= 7) return '1w';         // 1주
  if (dateRange <= 30) return '1m';        // 1개월
  if (dateRange <= 90) return '3m';        // 3개월
  if (dateRange <= 180) return '6m';       // 6개월
  if (dateRange <= 365) return '1y';       // 1년
  return 'all';                            // 전체 (기본값)
}

/**
 * 네이버 date_option을 네이버 URL의 date_option 번호로 변환
 */
export function naverOptionToDateOptionNumber(naverOption: NaverDateOption): number {
  const mapping = {
    'all': 0,  // 전체
    '1h': 1,   // 1시간
    '1d': 2,   // 1일
    '1w': 3,   // 1주
    '1m': 4,   // 1개월
    '3m': 5,   // 3개월
    '6m': 6,   // 6개월
    '1y': 7,   // 1년
    'custom': -1 // 직접입력 (URL 파라미터가 아닌 UI 조작 필요)
  } as const;
  return mapping[naverOption] || 0;
} 