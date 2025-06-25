import { NextRequest, NextResponse } from 'next/server';
import { NotionClient } from '@/lib/notion-client';
import { SettingsManager } from '@/lib/settings-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 통계 조회 API 호출됨');

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('period') || 'week'; // 기본값: week
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 설정 로드
    const settingsManager = new SettingsManager();
    const appSettings = await settingsManager.loadSettings();
    const settings = appSettings.api;

    if (!settings.notionApiKey || !settings.notionDatabaseId) {
      return NextResponse.json(
        { error: 'Notion 설정이 필요합니다.' },
        { status: 400 }
      );
    }

    // Notion 클라이언트 생성
    const notionClient = new NotionClient(
      settings.notionApiKey,
      settings.notionDatabaseId
    );

    // 통계 조회 (날짜 범위 전달)
    const statistics = await notionClient.getStatistics(periodType, startDate, endDate);
    
    // 최근 활동 조회
    const recentActivity = await notionClient.getRecentActivity(5);

    console.log('✅ 통계 조회 완료:', statistics);

    return NextResponse.json({
      success: true,
      statistics,
      recentActivity,
      period: {
        type: periodType,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error('❌ 통계 조회 실패:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        statistics: {
          totalCollected: 0,
          todayCollected: 0,
          thisWeekCollected: 0,
          thisMonthCollected: 0,
        },
        recentActivity: [],
      },
      { status: 500 }
    );
  }
} 