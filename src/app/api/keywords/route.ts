import { NextRequest, NextResponse } from 'next/server';
import { KeywordManager } from '@/lib/keyword-manager';
import { KeywordFormData } from '@/types/keyword';

const keywordManager = new KeywordManager();

/**
 * GET /api/keywords - 키워드 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const activeOnly = searchParams.get('active') === 'true';

    const config = await keywordManager.loadKeywords();
    
    let keywords = config.keywords;
    
    // 활성 키워드만 필터링
    if (activeOnly) {
      keywords = keywords.filter(k => k.active);
    }
    
    // 검색 필터링
    if (query) {
      const lowerQuery = query.toLowerCase();
      keywords = keywords.filter(k => 
        k.term.toLowerCase().includes(lowerQuery) ||
        k.category.toLowerCase().includes(lowerQuery)
      );
    }

    // 통계 정보 포함
    const statistics = await keywordManager.getStatistics();

    return NextResponse.json({
      success: true,
      data: keywords,
      statistics,
      settings: config.settings,
    });

  } catch (error) {
    console.error('키워드 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keywords - 키워드 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as KeywordFormData;
    
    // 유효성 검사
    if (!body.term || !body.category) {
      return NextResponse.json(
        { success: false, error: '키워드와 카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    if (body.term.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: '키워드는 2글자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const newKeyword = await keywordManager.addKeyword(body);

    return NextResponse.json({
      success: true,
      data: newKeyword,
      message: `키워드 "${newKeyword.term}"가 추가되었습니다.`,
    });

  } catch (error) {
    console.error('키워드 추가 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '키워드 추가에 실패했습니다.' 
      },
      { status: 400 }
    );
  }
} 