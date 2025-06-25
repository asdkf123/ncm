import fs from 'fs/promises';
import path from 'path';
import { Keyword, KeywordsConfig, KeywordFormData, KeywordSettings } from '@/types/keyword';

const KEYWORDS_FILE = path.join(process.cwd(), 'data', 'keywords.json');

const DEFAULT_CONFIG: KeywordsConfig = {
  keywords: [],
  settings: {
    defaultNewsCount: 10,
    defaultDateRange: 7,
    cronTime: '0 10 * * *', // 매일 오전 10시
    autoExecution: true,
  },
};

export class KeywordManager {
  /**
   * 설정 파일 초기화
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      const dataDir = path.dirname(KEYWORDS_FILE);
      await fs.mkdir(dataDir, { recursive: true });
      
      // 파일이 없으면 기본 설정으로 생성
      try {
        await fs.access(KEYWORDS_FILE);
      } catch {
        await fs.writeFile(KEYWORDS_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
        console.log('🆕 키워드 설정 파일이 생성되었습니다.');
      }
    } catch (error) {
      console.error('데이터 디렉토리 초기화 오류:', error);
      throw error;
    }
  }

  /**
   * 키워드 설정 불러오기
   */
  async loadKeywords(): Promise<KeywordsConfig> {
    try {
      await this.ensureDataDirectory();
      const data = await fs.readFile(KEYWORDS_FILE, 'utf-8');
      const config = JSON.parse(data) as KeywordsConfig;
      
      // 기본값과 병합
      return {
        keywords: config.keywords || [],
        settings: { ...DEFAULT_CONFIG.settings, ...config.settings },
      };
    } catch (error) {
      console.error('키워드 설정 로드 오류:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * 키워드 설정 저장
   */
  async saveKeywords(config: KeywordsConfig): Promise<void> {
    try {
      await this.ensureDataDirectory();
      await fs.writeFile(KEYWORDS_FILE, JSON.stringify(config, null, 2));
      console.log('💾 키워드 설정이 저장되었습니다.');
    } catch (error) {
      console.error('키워드 설정 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 키워드 추가
   */
  async addKeyword(formData: KeywordFormData): Promise<Keyword> {
    const config = await this.loadKeywords();
    
    // 중복 검사
    const exists = config.keywords.some(k => 
      k.term.toLowerCase() === formData.term.toLowerCase()
    );
    
    if (exists) {
      throw new Error(`키워드 "${formData.term}"는 이미 존재합니다.`);
    }

    const newKeyword: Keyword = {
      id: `keyword_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      term: formData.term.trim(),
      category: formData.category.trim(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    config.keywords.push(newKeyword);
    await this.saveKeywords(config);

    console.log(`✅ 키워드 추가: ${newKeyword.term}`);
    return newKeyword;
  }

  /**
   * 키워드 수정
   */
  async updateKeyword(id: string, updates: Partial<KeywordFormData>): Promise<Keyword> {
    const config = await this.loadKeywords();
    const keywordIndex = config.keywords.findIndex(k => k.id === id);
    
    if (keywordIndex === -1) {
      throw new Error('키워드를 찾을 수 없습니다.');
    }

    const keyword = config.keywords[keywordIndex];
    
    // 중복 검사 (다른 키워드와 비교)
    if (updates.term && updates.term !== keyword.term) {
      const exists = config.keywords.some((k, index) => 
        index !== keywordIndex && k.term.toLowerCase() === updates.term!.toLowerCase()
      );
      
      if (exists) {
        throw new Error(`키워드 "${updates.term}"는 이미 존재합니다.`);
      }
    }

    // 업데이트 적용
    const updatedKeyword: Keyword = {
      ...keyword,
      term: updates.term?.trim() || keyword.term,
      category: updates.category?.trim() || keyword.category,

      updatedAt: new Date(),
    };

    config.keywords[keywordIndex] = updatedKeyword;
    await this.saveKeywords(config);

    console.log(`📝 키워드 수정: ${updatedKeyword.term}`);
    return updatedKeyword;
  }

  /**
   * 키워드 삭제
   */
  async deleteKeyword(id: string): Promise<void> {
    const config = await this.loadKeywords();
    const originalLength = config.keywords.length;
    
    config.keywords = config.keywords.filter(k => k.id !== id);
    
    if (config.keywords.length === originalLength) {
      throw new Error('키워드를 찾을 수 없습니다.');
    }

    await this.saveKeywords(config);
    console.log(`🗑️ 키워드 삭제 완료`);
  }

  /**
   * 키워드 활성화/비활성화
   */
  async toggleKeyword(id: string): Promise<Keyword> {
    const config = await this.loadKeywords();
    const keyword = config.keywords.find(k => k.id === id);
    
    if (!keyword) {
      throw new Error('키워드를 찾을 수 없습니다.');
    }

    keyword.active = !keyword.active;
    keyword.updatedAt = new Date();
    
    await this.saveKeywords(config);
    
    console.log(`🔄 키워드 "${keyword.term}" ${keyword.active ? '활성화' : '비활성화'}`);
    return keyword;
  }

  /**
   * 활성 키워드 목록 조회
   */
  async getActiveKeywords(): Promise<Keyword[]> {
    const config = await this.loadKeywords();
    return config.keywords.filter(k => k.active);
  }

  /**
   * 설정 업데이트
   */
  async updateSettings(settings: Partial<KeywordSettings>): Promise<KeywordSettings> {
    const config = await this.loadKeywords();
    
    config.settings = {
      ...config.settings,
      ...settings,
    };

    await this.saveKeywords(config);
    
    console.log('⚙️ 설정이 업데이트되었습니다.');
    return config.settings;
  }

  /**
   * 통계 조회
   */
  async getStatistics(): Promise<{
    totalKeywords: number;
    activeKeywords: number;
    categories: { [key: string]: number };
    lastUpdated: Date | null;
  }> {
    const config = await this.loadKeywords();
    
    const categories: { [key: string]: number } = {};
    let lastUpdated: Date | null = null;

    config.keywords.forEach(keyword => {
      // 카테고리별 집계
      categories[keyword.category] = (categories[keyword.category] || 0) + 1;
      
      // 최근 업데이트 시간
      if (!lastUpdated || keyword.updatedAt > lastUpdated) {
        lastUpdated = keyword.updatedAt;
      }
    });

    return {
      totalKeywords: config.keywords.length,
      activeKeywords: config.keywords.filter(k => k.active).length,
      categories,
      lastUpdated,
    };
  }

  /**
   * 키워드 가져오기 (ID로)
   */
  async getKeywordById(id: string): Promise<Keyword | null> {
    const config = await this.loadKeywords();
    return config.keywords.find(k => k.id === id) || null;
  }

  /**
   * 키워드 검색
   */
  async searchKeywords(query: string): Promise<Keyword[]> {
    const config = await this.loadKeywords();
    const lowerQuery = query.toLowerCase();
    
    return config.keywords.filter(k => 
      k.term.toLowerCase().includes(lowerQuery) ||
      k.category.toLowerCase().includes(lowerQuery)
    );
  }
} 