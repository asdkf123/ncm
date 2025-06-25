import axios from 'axios';
import { NewsItem } from '@/types/scraping';

interface NaverNewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: {
    title: string;
    originallink: string;
    link: string;
    description: string;
    pubDate: string;
  }[];
}

export class NaverNewsAPI {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId?: string, clientSecret?: string) {
    // 매개변수로 받은 값이 있으면 사용, 없으면 환경변수 사용
    this.clientId = clientId || process.env.NAVER_CLIENT_ID!;
    this.clientSecret = clientSecret || process.env.NAVER_CLIENT_SECRET!;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('네이버 API 키가 설정되지 않았습니다.');
    }
  }

  /**
   * 뉴스 검색
   */
  async searchNews(
    keyword: string, 
    count: number = 10, 
    dateRange: number = 7
  ): Promise<NewsItem[]> {
    try {
      // 날짜 필터링 (YYYY.MM.DD 형식)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange);
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0].replace(/-/g, '.');
      };

      const response = await axios.get<NaverNewsResponse>(
        'https://openapi.naver.com/v1/search/news.json',
        {
          headers: {
            'X-Naver-Client-Id': this.clientId,
            'X-Naver-Client-Secret': this.clientSecret,
          },
          params: {
            query: keyword,
            display: Math.min(count, 100), // 최대 100개
            start: 1,
            sort: 'date', // 최신순
          },
        }
      );

      // HTML 태그 제거 및 데이터 변환
      const newsItems: NewsItem[] = response.data.items.map(item => ({
        title: this.removeHtmlTags(item.title),
        description: this.removeHtmlTags(item.description),
        originallink: item.originallink,
        link: item.link,
        pubDate: item.pubDate,
        keyword,
        source: 'naver_news',
        scrapedAt: new Date(),
      }));

      // 날짜 범위 필터링 (API에서 완벽하지 않을 수 있음)
      const filteredNews = newsItems.filter(item => {
        const newsDate = new Date(item.pubDate);
        return newsDate >= startDate && newsDate <= endDate;
      });

      console.log(`🔍 키워드 "${keyword}" 뉴스 ${filteredNews.length}개 수집 완료`);
      return filteredNews;

    } catch (error) {
      console.error('네이버 뉴스 API 오류:', error);
      throw new Error(`뉴스 검색 실패: ${keyword}`);
    }
  }

  /**
   * HTML 태그 제거
   */
  private removeHtmlTags(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * API 사용량 확인 (테스트용)
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.searchNews('테스트', 1, 1);
      return true;
    } catch (error) {
      console.error('네이버 API 연결 테스트 실패:', error);
      return false;
    }
  }
} 