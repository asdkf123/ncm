import { NextRequest, NextResponse } from 'next/server';
import { ChromeManager } from '@/lib/chrome-manager';

// 글로벌 Chrome 관리자 인스턴스
let chromeManager: ChromeManager | null = null;

function getChromeManager(): ChromeManager {
  if (!chromeManager) {
    chromeManager = new ChromeManager(9222);
  }
  return chromeManager;
}

/**
 * GET /api/chrome - Chrome 프로세스 상태 조회
 */
export async function GET() {
  try {
    const manager = getChromeManager();
    const status = await manager.getStatus(); // 비동기로 변경
    
    return NextResponse.json({
      success: true,
      data: status,
    });

  } catch (error) {
    console.error('Chrome 상태 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Chrome 상태 조회 실패' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chrome - Chrome 실행/종료 제어
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'action은 "start" 또는 "stop"이어야 합니다.' 
        },
        { status: 400 }
      );
    }

    const manager = getChromeManager();

    if (action === 'start') {
      const result = await manager.startChromeDebug();
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.details || null,
      }, { status: result.success ? 200 : 400 });
      
    } else if (action === 'stop') {
      const result = await manager.stopChromeDebug();
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
      }, { status: result.success ? 200 : 400 });
    }

  } catch (error) {
    console.error('Chrome 제어 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Chrome 제어 실패' 
      },
      { status: 500 }
    );
  }
} 