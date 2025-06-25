import fs from 'fs/promises';
import path from 'path';
import { AppSettings, ApiSettings, PeriodSettings, ScrapingSettings, SettingsFormData } from '@/types/settings';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  api: {
    naverClientId: process.env.NAVER_CLIENT_ID || '',
    naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
    notionApiKey: process.env.NOTION_API_KEY || '',
    notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
  },
  chrome: {
    debugPort: parseInt(process.env.CHROME_DEBUG_PORT || '9222'),
    debugHost: process.env.CHROME_DEBUG_HOST || 'localhost',
    userDataDir: '/tmp/chrome-debug',
  },
  period: {
    scrapingDateRange: 7, // 기본 7일
    statisticsDateRange: 'week', // 기본 주간 통계
    customStartDate: undefined,
    customEndDate: undefined,
    naverDateOption: 'all', // 기본값: 전체 기간
  },
  scraping: {
    newsCount: 10, // 기본 뉴스 수집 개수
    cafeCount: 5, // 기본 카페 수집 개수
    cafeEnabled: true, // 카페 수집 활성화
  },
  updatedAt: new Date(),
};

export class SettingsManager {
  /**
   * 설정 파일 초기화
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      const dataDir = path.dirname(SETTINGS_FILE);
      await fs.mkdir(dataDir, { recursive: true });
      
      // 파일이 없으면 기본 설정으로 생성
      try {
        await fs.access(SETTINGS_FILE);
      } catch {
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
        console.log('🆕 설정 파일이 생성되었습니다:', SETTINGS_FILE);
      }
    } catch (error) {
      console.error('설정 디렉토리 초기화 오류:', error);
      throw error;
    }
  }

  /**
   * 설정 불러오기
   */
  async loadSettings(): Promise<AppSettings> {
    try {
      await this.ensureDataDirectory();
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data) as AppSettings;
      
      // 기본값과 병합 (새로운 설정이 추가된 경우)
      return {
        api: { ...DEFAULT_SETTINGS.api, ...settings.api },
        chrome: { ...DEFAULT_SETTINGS.chrome, ...settings.chrome },
        period: { ...DEFAULT_SETTINGS.period, ...settings.period },
        scraping: { ...DEFAULT_SETTINGS.scraping, ...settings.scraping },
        updatedAt: settings.updatedAt ? new Date(settings.updatedAt) : new Date(),
      };
    } catch (error) {
      console.error('설정 로드 오류:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * 설정 저장
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await this.ensureDataDirectory();
      settings.updatedAt = new Date();
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
      console.log('💾 설정이 저장되었습니다:', SETTINGS_FILE);
    } catch (error) {
      console.error('설정 저장 오류:', error);
      throw error;
    }
  }

  /**
   * API 설정만 업데이트
   */
  async updateApiSettings(formData: SettingsFormData): Promise<ApiSettings> {
    const currentSettings = await this.loadSettings();
    
    const newApiSettings: ApiSettings = {
      naverClientId: formData.naverClientId.trim(),
      naverClientSecret: formData.naverClientSecret.trim(),
      notionApiKey: formData.notionApiKey.trim(),
      notionDatabaseId: formData.notionDatabaseId.trim(),
    };

    const updatedSettings: AppSettings = {
      ...currentSettings,
      api: newApiSettings,
    };

    await this.saveSettings(updatedSettings);
    console.log('⚙️ API 설정이 업데이트되었습니다.');
    return newApiSettings;
  }

  /**
   * 기간 설정만 업데이트
   */
  async updatePeriodSettings(periodSettings: PeriodSettings): Promise<PeriodSettings> {
    const currentSettings = await this.loadSettings();
    
    const updatedSettings: AppSettings = {
      ...currentSettings,
      period: { ...periodSettings },
    };

    await this.saveSettings(updatedSettings);
    console.log('📅 기간 설정이 업데이트되었습니다.');
    return periodSettings;
  }

  /**
   * API 설정만 가져오기
   */
  async getApiSettings(): Promise<ApiSettings> {
    const settings = await this.loadSettings();
    return settings.api;
  }

  /**
   * 기간 설정만 가져오기
   */
  async getPeriodSettings(): Promise<PeriodSettings> {
    const settings = await this.loadSettings();
    return settings.period;
  }

  /**
   * Chrome 설정 가져오기
   */
  async getChromeSettings() {
    const settings = await this.loadSettings();
    return settings.chrome;
  }

  /**
   * 스크래핑 설정만 업데이트
   */
  async updateScrapingSettings(scrapingSettings: ScrapingSettings): Promise<ScrapingSettings> {
    const currentSettings = await this.loadSettings();
    
    const updatedSettings: AppSettings = {
      ...currentSettings,
      scraping: { ...scrapingSettings },
    };

    await this.saveSettings(updatedSettings);
    console.log('⚙️ 스크래핑 설정이 업데이트되었습니다.');
    return scrapingSettings;
  }

  /**
   * 스크래핑 설정만 가져오기
   */
  async getScrapingSettings(): Promise<ScrapingSettings> {
    const settings = await this.loadSettings();
    return settings.scraping;
  }

  /**
   * 설정 유효성 검사
   */
  validateApiSettings(settings: ApiSettings): string[] {
    const errors: string[] = [];

    if (!settings.naverClientId) {
      errors.push('네이버 클라이언트 ID가 없습니다.');
    }
    if (!settings.naverClientSecret) {
      errors.push('네이버 클라이언트 시크릿이 없습니다.');
    }
    if (!settings.notionApiKey) {
      errors.push('Notion API 키가 없습니다.');
    }
    if (!settings.notionDatabaseId) {
      errors.push('Notion 데이터베이스 ID가 없습니다.');
    }

    return errors;
  }

  /**
   * 기간 설정 유효성 검사
   */
  validatePeriodSettings(settings: PeriodSettings): string[] {
    const errors: string[] = [];

    if (settings.scrapingDateRange < 1 || settings.scrapingDateRange > 365) {
      errors.push('스크래핑 날짜 범위는 1-365일 사이여야 합니다.');
    }

    if (settings.statisticsDateRange === 'custom') {
      if (!settings.customStartDate) {
        errors.push('커스텀 기간의 시작일을 설정해주세요.');
      }
      if (!settings.customEndDate) {
        errors.push('커스텀 기간의 종료일을 설정해주세요.');
      }
      if (settings.customStartDate && settings.customEndDate) {
        const startDate = new Date(settings.customStartDate);
        const endDate = new Date(settings.customEndDate);
        if (startDate >= endDate) {
          errors.push('시작일은 종료일보다 이전이어야 합니다.');
        }
      }
    }

    return errors;
  }
} 