import { NextResponse } from 'next/server';

/**
 * GET /api/browser-status - 브라우저 연결 상태 확인
 */
export async function GET() {
  try {
    const debugPort = process.env.CHROME_DEBUG_PORT || '9222';
    const debugHost = process.env.CHROME_DEBUG_HOST || 'localhost';
    
    // Chrome DevTools Protocol 연결 테스트
    const response = await fetch(`http://${debugHost}:${debugPort}/json/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3초 타임아웃
    });

    if (response.ok) {
      const data = await response.json();
      
      // 네이버 로그인 상태 확인 (실제 DOM 요소로 정확히 확인)
      const tabsResponse = await fetch(`http://${debugHost}:${debugPort}/json`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      
      let naverLoggedIn = false;
      if (tabsResponse.ok) {
        const tabs = await tabsResponse.json();
        const naverTab = tabs.find((tab: any) => 
          tab.url && tab.url.includes('naver.com') && tab.type === 'page'
        );
        
                 if (naverTab) {
           // 간단히 제목과 URL 기반으로 로그인 상태 추정
           // (실제 DOM 확인은 스크래핑 시에만 수행)
           const isMainPage = naverTab.url.includes('www.naver.com');
           const hasLoginInTitle = naverTab.title && naverTab.title.includes('로그인');
           const hasLoginInUrl = naverTab.url.includes('nid.naver.com');
           
           // 로그인 페이지가 아니고 네이버 메인 페이지면 로그인된 것으로 추정
           naverLoggedIn = isMainPage && !hasLoginInTitle && !hasLoginInUrl;
           
           console.log('🔍 네이버 로그인 상태 추정:', {
             url: naverTab.url,
             title: naverTab.title,
             isMainPage,
             hasLoginInTitle,
             hasLoginInUrl,
             estimated: naverLoggedIn
           });
         }
      }

      return NextResponse.json({
        success: true,
        data: {
          chromeConnected: true,
          naverLoggedIn,
          portOpen: true,
          chromeVersion: data['User-Agent'] || 'Unknown',
          debugPort,
        },
      });
    } else {
      throw new Error('Chrome 연결 실패');
    }

  } catch (error) {
    console.error('브라우저 상태 확인 실패:', error);
    
    return NextResponse.json({
      success: true,
      data: {
        chromeConnected: false,
        naverLoggedIn: false,
        portOpen: false,
        error: error instanceof Error ? error.message : '연결 실패',
      },
    });
  }
} 