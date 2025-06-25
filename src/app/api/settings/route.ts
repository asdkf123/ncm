import { NextRequest, NextResponse } from 'next/server';
import { SettingsManager } from '@/lib/settings-manager';
import { SettingsFormData, ScrapingSettings } from '@/types/settings';

const settingsManager = new SettingsManager();

/**
 * GET /api/settings - 설정 조회
 */
export async function GET() {
  try {
    const settings = await settingsManager.loadSettings();
    
    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('설정 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '설정 조회 실패' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings - 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as SettingsFormData;
    
    // 유효성 검사
    const errors = settingsManager.validateApiSettings({
      naverClientId: body.naverClientId,
      naverClientSecret: body.naverClientSecret,
      notionApiKey: body.notionApiKey,
      notionDatabaseId: body.notionDatabaseId,
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '설정 값이 올바르지 않습니다.',
          details: errors,
        },
        { status: 400 }
      );
    }

    // API 설정 업데이트
    const updatedApiSettings = await settingsManager.updateApiSettings(body);

    return NextResponse.json({
      success: true,
      data: updatedApiSettings,
      message: 'API 설정이 성공적으로 저장되었습니다.',
    });

  } catch (error) {
    console.error('설정 업데이트 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '설정 업데이트 실패' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings - 스크래핑 설정만 업데이트
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'scraping') {
      const scrapingSettings: ScrapingSettings = {
        newsCount: data.newsCount,
        cafeCount: data.cafeCount,
        cafeEnabled: data.cafeEnabled,
      };

      // 유효성 검사
      if (scrapingSettings.newsCount < 1 || scrapingSettings.newsCount > 100) {
        return NextResponse.json(
          { success: false, error: '뉴스 수집 개수는 1-100개 사이여야 합니다.' },
          { status: 400 }
        );
      }
      if (scrapingSettings.cafeCount < 1 || scrapingSettings.cafeCount > 50) {
        return NextResponse.json(
          { success: false, error: '카페 수집 개수는 1-50개 사이여야 합니다.' },
          { status: 400 }
        );
      }

      const updatedSettings = await settingsManager.updateScrapingSettings(scrapingSettings);

      return NextResponse.json({
        success: true,
        data: updatedSettings,
        message: '스크래핑 설정이 업데이트되었습니다.',
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 설정 타입입니다.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('스크래핑 설정 업데이트 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '스크래핑 설정 업데이트 실패' 
      },
      { status: 500 }
    );
  }
} 