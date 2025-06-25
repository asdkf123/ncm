import { NextRequest, NextResponse } from 'next/server';
import { KeywordManager } from '@/lib/keyword-manager';
import { KeywordFormData } from '@/types/keyword';

const keywordManager = new KeywordManager();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/keywords/[id] - 특정 키워드 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const keyword = await keywordManager.getKeywordById(id);

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: '키워드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: keyword,
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
 * PUT /api/keywords/[id] - 키워드 수정
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<KeywordFormData>;

    // 유효성 검사
    if (body.term && body.term.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: '키워드는 2글자 이상이어야 합니다.' },
        { status: 400 }
      );
    }



    const updatedKeyword = await keywordManager.updateKeyword(id, body);

    return NextResponse.json({
      success: true,
      data: updatedKeyword,
      message: `키워드 "${updatedKeyword.term}"가 수정되었습니다.`,
    });

  } catch (error) {
    console.error('키워드 수정 오류:', error);
    const status = error instanceof Error && error.message.includes('찾을 수 없습니다') ? 404 : 400;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '키워드 수정에 실패했습니다.' 
      },
      { status }
    );
  }
}

/**
 * DELETE /api/keywords/[id] - 키워드 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await keywordManager.deleteKeyword(id);

    return NextResponse.json({
      success: true,
      message: '키워드가 삭제되었습니다.',
    });

  } catch (error) {
    console.error('키워드 삭제 오류:', error);
    const status = error instanceof Error && error.message.includes('찾을 수 없습니다') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '키워드 삭제에 실패했습니다.' 
      },
      { status }
    );
  }
}

/**
 * PATCH /api/keywords/[id] - 키워드 활성화/비활성화
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'toggle') {
      const updatedKeyword = await keywordManager.toggleKeyword(id);

      return NextResponse.json({
        success: true,
        data: updatedKeyword,
        message: `키워드 "${updatedKeyword.term}"가 ${updatedKeyword.active ? '활성화' : '비활성화'}되었습니다.`,
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 액션입니다.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('키워드 상태 변경 오류:', error);
    const status = error instanceof Error && error.message.includes('찾을 수 없습니다') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '키워드 상태 변경에 실패했습니다.' 
      },
      { status }
    );
  }
} 