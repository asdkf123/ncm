import { NextRequest, NextResponse } from 'next/server';
import { NaverNewsAPI } from '@/lib/naver-api';
import { MCPPlaywrightClient } from '@/lib/mcp-playwright';
import { NotionClient } from '@/lib/notion-client';
import { KeywordManager } from '@/lib/keyword-manager';
import { ScrapingResult, ScrapingConfig } from '@/types/scraping';

const keywordManager = new KeywordManager();

// 기본 스크래핑 설정
const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  mode: 'normal',
  delayRange: {
    min: 30000,  // 30초
    max: 180000, // 3분
  },
  maxItemsPerHour: 20,
  humanPatterns: {
    enableMouseMovement: true,
    enableMistakePattern: true,
    enableReadingPattern: true,
  },
};

/**
 * POST /api/scraping - 스크래핑 실행
 */
export async function POST(request: NextRequest) {
  const startTime = new Date();
  let results: ScrapingResult[] = [];

  try {
    const body = await request.json();
    const { keywordIds, mode = 'normal', testMode = false, dateRange = 7 } = body;

    console.log('🚀 스크래핑 시작:', { keywordIds, mode, testMode, dateRange });

    // 스크래핑 설정
    const config: ScrapingConfig = {
      ...DEFAULT_SCRAPING_CONFIG,
      mode,
      delayRange: getDelayRangeByMode(mode),
    };

    console.log(`⚙️ 스크래핑 모드: ${mode} (지연시간: ${config.delayRange.min/1000}-${config.delayRange.max/1000}초)`);

    // 키워드 목록 가져오기
    let keywords;
    if (keywordIds && keywordIds.length > 0) {
      // 특정 키워드들만 처리
      const allKeywords = await keywordManager.loadKeywords();
      keywords = allKeywords.keywords.filter(k => 
        keywordIds.includes(k.id) && k.active
      );
    } else {
      // 모든 활성 키워드 처리
      keywords = await keywordManager.getActiveKeywords();
    }

    if (keywords.length === 0) {
      return NextResponse.json({
        success: false,
        error: '처리할 활성 키워드가 없습니다.',
      }, { status: 400 });
    }

    console.log(`📋 처리할 키워드 ${keywords.length}개:`, keywords.map(k => k.term));

    // JSON 설정에서 API 키와 스크래핑 설정 불러오기
    const { SettingsManager } = await import('@/lib/settings-manager');
    const settingsManager = new SettingsManager();
    const apiSettings = await settingsManager.getApiSettings();
    const scrapingSettings = await settingsManager.getScrapingSettings();

    // API 클라이언트 초기화 (JSON 설정 사용)
    const naverNewsAPI = new NaverNewsAPI(apiSettings.naverClientId, apiSettings.naverClientSecret);
    const notionClient = new NotionClient(apiSettings.notionApiKey, apiSettings.notionDatabaseId);
    const mcpClient = new MCPPlaywrightClient(config);

    // 테스트 모드가 아닌 경우 브라우저 연결 확인
    let browserConnected = false;
    if (!testMode) {
      browserConnected = await mcpClient.connectToBrowser();
      if (!browserConnected) {
        console.warn('🔌 브라우저 연결 실패 - 카페 스크래핑 건너뜀');
      }
    }

    // 각 키워드별로 스크래핑 실행
    for (const keyword of keywords) {
      const keywordStartTime = new Date();
      
      try {
        console.log(`\n🔍 키워드 "${keyword.term}" 처리 시작...`);

        // 1. 네이버 뉴스 스크래핑 (동적 날짜 범위 사용)
        console.log(`📰 뉴스 검색 중... (최대 ${scrapingSettings.newsCount}개)`);
        const newsItems = await naverNewsAPI.searchNews(
          keyword.term,
          scrapingSettings.newsCount,
          dateRange // 요청에서 받은 dateRange 사용
        );
        console.log(`🔍 키워드 "${keyword.term}" 뉴스 ${newsItems.length}개 수집 완료`);

        // 2. 카페 스크래핑 (브라우저 연결되고 활성화된 경우)
        let cafePosts: Array<any> = [];
        if (!testMode && browserConnected && scrapingSettings.cafeEnabled) {
          try {
            console.log(`☕ 카페 검색 시작... (최대 ${scrapingSettings.cafeCount}개)`);
            cafePosts = await mcpClient.scrapeCafePosts(
              keyword.term,
              scrapingSettings.cafeCount,
              dateRange // UI에서 받은 dateRange를 카페 스크래핑에 전달
            );
            console.log(`🔍 키워드 "${keyword.term}" 카페 ${cafePosts.length}개 수집 완료`);
          } catch (cafeError) {
            console.error(`❌ 카페 스크래핑 오류 (${keyword.term}):`, cafeError);
            // 카페 오류는 전체 프로세스를 중단하지 않음
          }
        }

        // 3. Notion 저장 (테스트 모드가 아닌 경우)
        if (!testMode) {
          console.log(`💾 Notion 저장 중... (뉴스 ${newsItems.length}개, 카페 ${cafePosts.length}개)`);
          const saveResult = await notionClient.saveBulk(newsItems, cafePosts);
          console.log(`✅ Notion 저장 완료: 뉴스 ${saveResult.summary.successNews}/${saveResult.summary.totalNews}, 카페 ${saveResult.summary.successCafe}/${saveResult.summary.totalCafe}`);
        }

        // 결과 저장
        const result: ScrapingResult = {
          keyword: keyword.term,
          news: newsItems,
          cafePosts,
          totalItems: newsItems.length + cafePosts.length,
          startTime: keywordStartTime,
          endTime: new Date(),
          success: true,
        };

        results.push(result);

        console.log(`✅ "${keyword.term}" 완료: 뉴스 ${newsItems.length}개, 카페 ${cafePosts.length}개`);

        // 인간적인 지연 (다음 키워드 처리 전, fast 모드는 즉시 실행)
        if (!testMode && keywords.indexOf(keyword) < keywords.length - 1) {
          if (mode === 'fast') {
            console.log(`⚡ Fast 모드: 즉시 다음 키워드 처리`);
          } else {
            const delay = config.delayRange.min + Math.random() * (config.delayRange.max - config.delayRange.min);
            console.log(`⏳ ${Math.round(delay / 1000)}초 대기 중...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

      } catch (keywordError) {
        console.error(`❌ 키워드 "${keyword.term}" 처리 오류:`, keywordError);
        
        // 실패 결과 기록
        results.push({
          keyword: keyword.term,
          news: [],
          cafePosts: [],
          totalItems: 0,
          startTime: keywordStartTime,
          endTime: new Date(),
          success: false,
          error: keywordError instanceof Error ? keywordError.message : '알 수 없는 오류',
        });
      }
    }

    // 브라우저 연결 해제
    if (browserConnected) {
      await mcpClient.disconnect();
    }

    // 전체 결과 요약
    const totalItems = results.reduce((sum, r) => sum + r.totalItems, 0);
    const successCount = results.filter(r => r.success).length;
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    console.log(`\n🎉 스크래핑 완료: ${successCount}/${results.length} 성공, 총 ${totalItems}개 수집, ${duration}초 소요`);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalKeywords: results.length,
          successKeywords: successCount,
          totalItems,
          duration,
          startTime,
          endTime,
        },
        results,
      },
      message: `스크래핑 완료: ${successCount}/${results.length} 키워드 성공`,
    });

  } catch (error) {
    console.error('❌ 스크래핑 전체 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '스크래핑 중 오류가 발생했습니다.',
      data: {
        summary: {
          totalKeywords: results.length,
          successKeywords: results.filter(r => r.success).length,
          totalItems: results.reduce((sum, r) => sum + r.totalItems, 0),
          duration: Math.round((new Date().getTime() - startTime.getTime()) / 1000),
          startTime,
          endTime: new Date(),
        },
        results,
      },
    }, { status: 500 });
  }
}

/**
 * GET /api/scraping - 스크래핑 상태 조회
 */
export async function GET() {
  try {
    // JSON 설정에서 API 키 불러오기
    const { SettingsManager } = await import('@/lib/settings-manager');
    const settingsManager = new SettingsManager();
    const apiSettings = await settingsManager.getApiSettings();

    // 연결 상태 테스트 (JSON 설정 사용)
    const naverAPI = new NaverNewsAPI(apiSettings.naverClientId, apiSettings.naverClientSecret);
    const notionClient = new NotionClient(apiSettings.notionApiKey, apiSettings.notionDatabaseId);
    
    const naverConnected = await naverAPI.testConnection();
    const notionConnected = await notionClient.testConnection();
    
    // 활성 키워드 수 조회
    const activeKeywords = await keywordManager.getActiveKeywords();
    
    return NextResponse.json({
      success: true,
      data: {
        connections: {
          naver: naverConnected,
          notion: notionConnected,
          browser: false, // 실시간으로는 확인 어려움
        },
        activeKeywords: activeKeywords.length,
        lastCheck: new Date(),
      },
    });

  } catch (error) {
    console.error('스크래핑 상태 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '상태 조회 실패',
    }, { status: 500 });
  }
}

/**
 * 모드별 지연시간 설정
 */
function getDelayRangeByMode(mode: string) {
  switch (mode) {
    case 'safe':
      return { min: 120000, max: 300000 }; // 2-5분
    case 'fast':
      return { min: 0, max: 0 };           // 즉시 실행
    case 'urgent':
      return { min: 10000, max: 30000 };   // 10-30초
    case 'normal':
    default:
      return { min: 30000, max: 180000 };  // 30초-3분
  }
} 