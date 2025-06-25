import puppeteer, { Browser, Page } from 'puppeteer';
import { CafePost, ScrapingConfig, NaverDateOption } from '@/types/scraping';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class MCPPlaywrightClient {
  private browser: Browser | null = null;
  private config: ScrapingConfig;

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  /**
   * 브라우저 연결 (CDP 방식)
   */
  async connectToBrowser(): Promise<boolean> {
    try {
      const debugPort = process.env.CHROME_DEBUG_PORT || '9222';
      const debugHost = process.env.CHROME_DEBUG_HOST || 'localhost';
      
      // CDP를 통해 기존 브라우저에 연결
      this.browser = await puppeteer.connect({
        browserURL: `http://${debugHost}:${debugPort}`,
        defaultViewport: null,
      });

      console.log('🔗 기존 브라우저에 연결되었습니다.');
      return true;

    } catch (error) {
      console.error('브라우저 연결 실패:', error);
      console.log('💡 Chrome을 디버그 모드로 실행하세요:');
      console.log('google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
      return false;
    }
  }

  /**
   * 네이버 카페 검색 및 스크래핑
   */
  async scrapeCafePosts(keyword: string, maxPosts: number = 10, dateRange?: number): Promise<CafePost[]> {
    if (!this.browser) {
      throw new Error('브라우저가 연결되지 않았습니다. connectToBrowser()를 먼저 호출하세요.');
    }

    const results: CafePost[] = [];
    let page: Page | null = null;

    try {
      // 네이버 탭 찾기 또는 새 탭 생성
      page = await this.findOrCreateNaverTab();
      
      console.log(`🔍 키워드 "${keyword}" 카페 검색 시작...`);

      // 네이버 카페 검색 (에러 처리 개선)
      await this.searchCafe(page, keyword, dateRange);

      // 검색 결과 스크래핑
      const posts = await this.extractCafePosts(page, keyword, maxPosts);
      results.push(...posts);

      console.log(`✅ 카페글 ${results.length}개 수집 완료`);
      return results;

    } catch (error) {
      console.error('❌ 카페 스크래핑 오류:', error);
      
      // 로그인 관련 에러인 경우 빈 배열 반환 (전체 프로세스 중단하지 않음)
      if (error instanceof Error && error.message.includes('로그인이 필요')) {
        console.log('🔄 카페 스크래핑을 건너뛰고 계속 진행합니다.');
        return [];
      }
      
      // 기타 에러의 경우 빈 배열 반환하고 로그만 남김
      console.log('🔄 카페 스크래핑에 실패했지만 다른 수집은 계속 진행합니다.');
      return [];
    }
  }

  /**
   * 네이버 탭 찾기 또는 생성
   */
  private async findOrCreateNaverTab(): Promise<Page> {
    if (!this.browser) throw new Error('브라우저가 연결되지 않았습니다.');

    const pages = await this.browser.pages();
    
    // 기존 네이버 탭 찾기
    for (const page of pages) {
      const url = page.url();
      if (url.includes('naver.com')) {
        console.log('🔗 기존 네이버 탭을 사용합니다.');
        return page;
      }
    }

    // 새 탭 생성
    console.log('🆕 새 네이버 탭을 생성합니다.');
    const page = await this.browser.newPage();
    await page.goto('https://www.naver.com');
    return page;
  }

  /**
   * 카페 검색 실행 (검색창에 키워드 입력 후 카페 탭 클릭)
   */
  private async searchCafe(page: Page, keyword: string, dateRange?: number): Promise<void> {
    try {
      console.log(`🔍 키워드 "${keyword}" 카페 검색 시작...`);
      
      // 네이버 메인으로 이동
      console.log('🌐 네이버 메인 페이지로 이동 중...');
      console.log('⏳ 페이지 이동 전 대기... (1-3초)');
      await this.humanDelay();

      await page.goto('https://www.naver.com', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      
      console.log('✅ 네이버 메인 페이지 로딩 완료');
      console.log('⏳ 페이지 안정화 대기...');
      await this.humanDelay();

      // 로그인 상태 확인
      console.log('🔍 로그인 상태 확인 중...');
      const isLoggedIn = await this.checkLoginStatus(page);
      
      if (!isLoggedIn) {
        throw new Error('네이버 로그인이 필요합니다. 브라우저에서 로그인 후 다시 시도해주세요.');
      }

      console.log('✅ 로그인 상태 확인됨');
      
      // 검색창 찾기
      console.log('🔍 검색창 찾는 중... (최대 10초 대기)');
      const searchInput = await page.waitForSelector('#query', { timeout: 10000 });
      if (!searchInput) {
        throw new Error('검색창을 찾을 수 없습니다.');
      }
      console.log('✅ 검색창 발견');

      // 검색어 입력
      console.log(`⌨️ 키워드 "${keyword}" 입력 중...`);
      await searchInput.click({ clickCount: 3 }); // 기존 텍스트 선택
      await this.humanType(page, '#query', keyword);
      
      // 검색 실행
      console.log('🔘 검색 실행 중...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
        page.keyboard.press('Enter')
      ]);
      
      console.log('✅ 검색 결과 페이지 로딩 완료');

      // 카페 탭 찾기 및 클릭
      console.log('☕ 카페 탭 찾는 중...');
      
      let cafeTab: any = null;
      let cafeTabSelector = '';
      
      // 1단계: 정확한 검색 탭 카페 링크 찾기
      const primarySelectors = [
        'a[href*="ssc=tab.cafe"]',
        'a.tab[href*="cafe"]',
        '.api_flicking_wrap a[href*="cafe"]'
      ];
      
      for (const selector of primarySelectors) {
        try {
          cafeTab = await page.$(selector);
          if (cafeTab) {
            const text = await cafeTab.evaluate((el: any) => el.textContent?.trim());
            const href = await cafeTab.evaluate((el: any) => el.href);
            
            if (text === '카페' && href.includes('ssc=tab.cafe')) {
              cafeTabSelector = selector;
              console.log(`📍 카페 탭 발견: ${selector} - 텍스트: "${text}"`);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
       
       // 2단계: 일반 검색 결과에서 카페 탭 찾기
       if (!cafeTab) {
         cafeTab = await page.evaluate(() => {
           // 먼저 검색 탭 영역에서 카페 탭 찾기
           const tabContainers = ['.api_flicking_wrap', '[role="tablist"]', '.tab_menu'];
           for (const containerSelector of tabContainers) {
             const container = document.querySelector(containerSelector);
             if (container) {
               const links = container.querySelectorAll('a');
               for (const link of links) {
                 const text = link.textContent?.trim();
                 const href = link.href;
                 if (text === '카페' && href.includes('ssc=tab.cafe')) {
                   return link;
                 }
               }
             }
           }
           
           // 전체 페이지에서 검색 탭 형태의 카페 링크 찾기
           const allLinks = Array.from(document.querySelectorAll('a'));
           return allLinks.find(link => {
             const text = link.textContent?.trim();
             const href = link.href;
             
             return text === '카페' && 
                    (href.includes('ssc=tab.cafe') || 
                     (href.includes('tab') && href.includes('cafe')));
           });
         });
         
         const hasTab = await page.evaluate(tab => !!tab, cafeTab);
         if (hasTab) {
           cafeTabSelector = 'search-tab cafe tab';
           const tabText = await page.evaluate(tab => tab?.textContent?.trim(), cafeTab);
           const tabHref = await page.evaluate(tab => tab?.href, cafeTab);
           console.log(`📍 검색 탭 카페 탭 발견: "${tabText}", href: "${tabHref}"`);
         } else {
           throw new Error('카페 탭을 찾을 수 없습니다. 검색 결과 페이지 구조가 변경되었을 수 있습니다.');
         }
       }

       console.log('✅ 카페 탭 발견, 클릭 중...');
       
       // 실제 요소를 직접 클릭 (선택자가 아닌 요소 자체)
       try {
         if (cafeTabSelector === 'search-tab cafe tab') {
           // 검색 탭에서 찾은 경우
           await page.evaluate(tab => {
             if (tab) (tab as HTMLElement).click();
           }, cafeTab);
         } else {
           // 일반적인 클릭
           await (cafeTab as any).click();
         }
       } catch (clickError) {
         console.log('🔄 일반 클릭 실패, JavaScript 클릭 시도...');
         // 클릭이 실패하면 JavaScript로 클릭 시도
         if (cafeTabSelector.startsWith('a[href*="ssc=tab.cafe"]')) {
           await page.evaluate(() => {
             const element = document.querySelector('a[href*="ssc=tab.cafe"]');
             if (element) (element as HTMLElement).click();
           });
         } else {
           await page.evaluate((selector) => {
             const element = document.querySelector(selector);
             if (element) (element as HTMLElement).click();
           }, cafeTabSelector);
         }
       }
      
      console.log('⏳ 카페 검색 결과 로딩 대기 중... (최대 20초)');
      
      // 카페 검색 결과 로딩 대기 (웹 검색에서 확인된 실제 구조)
      const resultLoaded = await Promise.race([
        page.waitForSelector('.total_wrap', { timeout: 15000 }).then(() => 'total_wrap'), // 전체 검색 결과 영역
        page.waitForSelector('.cafe_item', { timeout: 15000 }).then(() => 'cafe_item'),   // 개별 카페 아이템
        page.waitForSelector('.api_subject_bx', { timeout: 15000 }).then(() => 'api_subject_bx'), // API 주제 박스
        page.waitForSelector('.lst_total', { timeout: 15000 }).then(() => 'lst_total'),   // 총 목록
        page.waitForSelector('.view_list', { timeout: 15000 }).then(() => 'view_list'),   // 리스트 뷰
        page.waitForSelector('.no_result', { timeout: 15000 }).then(() => 'no_result'),   // 결과 없음
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('카페 검색 결과 로딩 타임아웃 (20초)')), 20000))
      ]);

      if (resultLoaded === 'no_result') {
        console.log('📭 카페 검색 결과가 없습니다.');
        return;
      }

      console.log(`✅ 카페 검색 결과 로딩 완료 (${resultLoaded} 섹션)`);
      
      // 기간 옵션 설정
      await this.setSearchPeriod(page, dateRange);
      
      console.log('⏳ 검색 결과 안정화 대기...');
      await this.humanDelay();

    } catch (error) {
      console.error('❌ 카페 검색 실행 오류:', error);
      
      // 현재 페이지 URL과 상태 로그
      try {
        const currentUrl = page.url();
        const title = await page.title();
        console.log(`📄 현재 페이지: ${title} (${currentUrl})`);
      } catch (urlError) {
        console.log('📄 페이지 정보 조회 실패');
      }
      
      throw error;
    }
  }

  /**
   * 로그인 상태 확인 (다양한 선택자로 정확히 확인)
   */
  private async checkLoginStatus(page: Page): Promise<boolean> {
    try {
      // 다양한 로그인 상태 선택자들 시도 (해시 부분 제외한 안정적인 선택자)
      const loginSelectors = [
        // 로그아웃 버튼 (로그인됨)
        'button[class*="btn_logout"]',          // CSS 모듈의 btn_logout 포함
        '[class*="MyView-module"][class*="btn_logout"]', // MyView 모듈의 로그아웃 버튼
        'button',                               // 모든 버튼 (텍스트로 필터링)
        
        // 내정보/마이페이지 관련 (로그인됨)
        '[class*="my_area"]',                   // my_area 포함 클래스
        '[class*="mynv"]',                      // mynv 포함 클래스
        '[class*="MyView-module"]',             // MyView 모듈 관련
        'a[href*="nid.naver.com/nidlogin.logout"]', // 로그아웃 URL
        '.gnb_my',                              // 내정보
        
        // 로그인 링크 (로그인 안됨)
        'a[href*="nid.naver.com/nidlogin"]',    // 로그인 URL
        '.link_login',                          // 로그인 링크
        '[class*="btn_login"]',                 // 로그인 버튼 클래스
        'a',                                    // 모든 링크 (텍스트로 필터링)
      ];
      
      let isLoggedIn = false;
      let foundSelector = '';
      
      // 1단계: CSS 선택자로 요소 찾기
      for (const selector of loginSelectors) {
        const elements = await page.$$(selector);
        for (const element of elements) {
          const text = await element.evaluate(el => el.textContent?.trim() || '');
          const href = await element.evaluate(el => (el as any).href || '');
          const className = await element.evaluate(el => (el as HTMLElement).className || '');
          
          console.log(`📍 발견된 요소: ${selector} - 텍스트: "${text}", href: "${href}", class: "${className}"`);
          
          // 로그인 상태를 나타내는 요소들
          if (selector.includes('logout') || 
              selector.includes('my_area') || 
              selector.includes('mynv') || 
              selector.includes('MyView-module') ||
              text.includes('로그아웃') ||
              href.includes('logout') ||
              (text && (text.includes('님') || text.includes('MY') || text.includes('마이')))) {
            isLoggedIn = true;
            foundSelector = `${selector} (${text || href})`;
            break;
          }
          
          // 로그인이 필요함을 나타내는 요소들
          if ((selector.includes('login') || text.includes('로그인')) && 
              !text.includes('로그아웃') &&
              !href.includes('logout')) {
            isLoggedIn = false;
            foundSelector = `${selector} (${text})`;
            // 로그인 링크를 찾았으므로 확실히 로그인이 안된 상태로 판단하지 말고 계속 검사
          }
        }
        
        if (isLoggedIn) break; // 로그인 상태 확인되면 중단
      }
      
      // 2단계: 텍스트 기반으로 버튼 찾기 (더 정확한 방법)
      if (!isLoggedIn) {
        console.log('🔍 텍스트 기반 로그아웃 버튼 검색 중...');
        const logoutButtons = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          return buttons.filter(btn => 
            btn.textContent?.includes('로그아웃') || 
            (btn as HTMLAnchorElement).href?.includes('logout')
          );
        });
        
        const logoutButtonsArray = await page.evaluate(handle => handle.length, logoutButtons);
        
        if (logoutButtonsArray > 0) {
          const firstLogoutButton = await page.evaluateHandle(handle => handle[0], logoutButtons);
          const logoutText = await page.evaluate(btn => btn.textContent?.trim(), firstLogoutButton);
          const logoutHref = await page.evaluate(btn => (btn as HTMLAnchorElement).href, firstLogoutButton);
          
          console.log(`✅ 로그아웃 버튼 발견: "${logoutText}", href: "${logoutHref}"`);
          isLoggedIn = true;
          foundSelector = `text-based logout button (${logoutText})`;
        }
      }
      
      console.log(`🔍 로그인 상태 검사 결과: ${isLoggedIn ? '✅ 로그인됨' : '❌ 로그인 안됨'} (${foundSelector})`);
      return isLoggedIn;
      
    } catch (error) {
      console.log(`⚠️ 로그인 상태 확인 오류: ${error}`);
      return false;
    }
  }

  /**
   * 검색 기간 옵션 설정
   */
  private async setSearchPeriod(page: Page, dateRange?: number): Promise<void> {
    try {
      console.log('📅 검색 기간 옵션 설정 중...');
      
      let naverDateOption: string;
      
      if (dateRange !== undefined) {
        // UI에서 받은 dateRange 값을 네이버 옵션으로 변환
        const { dateRangeToNaverOption, naverOptionToDateOptionNumber } = await import('@/types/settings');
        naverDateOption = dateRangeToNaverOption(dateRange);
        console.log(`📅 UI 설정값: ${dateRange}일 → 네이버 옵션: ${naverDateOption}`);
      } else {
        // 설정 파일에서 네이버 기간 옵션 가져오기 (기본값)
        const { SettingsManager } = await import('./settings-manager');
        const settingsManager = new SettingsManager();
        const settings = await settingsManager.loadSettings();
        naverDateOption = settings.period.naverDateOption || '1w';
        console.log(`📅 설정 파일에서 가져온 기간: ${naverDateOption}`);
      }
      
      console.log(`⏰ 적용할 기간: ${naverDateOption}`);
      
      // 기간 옵션이 '전체'가 아닌 경우에만 클릭
      if (naverDateOption !== 'all') {
        // naverDateOption을 date_option 번호로 변환
        const { naverOptionToDateOptionNumber } = await import('@/types/settings');
        const dateOptionNumber = naverOptionToDateOptionNumber(naverDateOption as any);
        
        const optionSelector = `a[href*="date_option=${dateOptionNumber}"]`;
        
        try {
          // 기간 옵션 찾기
          const periodOption = await page.$(optionSelector);
          if (periodOption) {
            console.log(`📅 기간 옵션 "${naverDateOption}" (date_option=${dateOptionNumber}) 클릭 중...`);
            await periodOption.click();
            
            // 페이지 리로드 대기
            console.log('⏳ 기간 옵션 적용 대기...');
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
            await this.humanDelay();
            
            console.log(`✅ 기간 옵션 "${naverDateOption}" 적용 완료`);
          } else {
            console.log(`⚠️ 기간 옵션 "${naverDateOption}" (date_option=${dateOptionNumber}) 버튼을 찾을 수 없습니다.`);
          }
        } catch (periodError) {
          console.log(`⚠️ 기간 옵션 설정 실패: ${periodError}`);
        }
      } else {
        console.log('📅 전체 기간으로 설정됨 (기본값)');
      }
      
    } catch (error) {
      console.log(`⚠️ 기간 옵션 설정 오류: ${error}`);
      // 기간 설정 실패는 치명적이지 않으므로 계속 진행
    }
  }

  /**
   * 카페 글 추출 (웹 검색 결과에서 실제 카페 글 내용 수집)
   */
  private async extractCafePosts(page: Page, keyword: string, maxPosts: number): Promise<CafePost[]> {
    const posts: CafePost[] = [];

    try {
      console.log('🔍 카페 검색 결과 요소 탐색 중...');
      
      // 웹 검색 결과에서 확인된 실제 선택자들로 카페 글 찾기
      const cafeItemSelectors = [
        '.total_wrap .title_area',          // 제목 영역 (실제 HTML 구조 기반)
        '.title_area a.title_link',         // 제목 링크 (사용자 제공 구조)
        '.api_subject_bx a',                // API 주제 박스 내 링크
        '.cafe_item a',                     // 카페 아이템 링크
        '.lst_total li a',                  // 리스트 아이템 링크
        'a[href*="cafe.naver.com"]'         // 모든 카페 링크
      ];
      
      let postElements: any[] = [];
      let foundSelector = '';
      
      for (const selector of cafeItemSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            postElements = elements;
            foundSelector = selector;
            console.log(`📍 카페 글 요소 발견: ${selector} (${elements.length}개)`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (postElements.length === 0) {
        console.log('⚠️ 카페 검색 결과를 찾을 수 없습니다. 페이지 구조를 분석합니다...');
        
        // 페이지 구조 분석
        const pageStructure = await page.evaluate(() => {
          const allLinks = Array.from(document.querySelectorAll('a[href*="cafe"]'));
          return allLinks.slice(0, 3).map(link => ({
            text: link.textContent?.trim().substring(0, 50),
            href: (link as HTMLAnchorElement).href,
            className: link.className,
            parent: link.parentElement?.tagName
          }));
        });
        
        console.log('📋 페이지 내 카페 링크 분석:', pageStructure);
        return posts;
      }

      const actualMaxPosts = Math.min(maxPosts, postElements.length);
      console.log(`📄 총 ${postElements.length}개 카페글 발견, ${actualMaxPosts}개 처리 예정 (선택자: ${foundSelector})`);

      for (let i = 0; i < actualMaxPosts; i++) {
        try {
          console.log(`📝 ${i + 1}/${actualMaxPosts} 카페글 처리 중...`);
          const element = postElements[i];
          
          // 제목과 링크 추출 (실제 HTML 구조 기반)
          let title = '';
          let url = '';
          let cafeName = '';
          
          // 방법 1: 링크 요소에서 직접 추출 (가장 정확)
          if (foundSelector.includes('title_link') || foundSelector.includes('a')) {
            try {
              url = await element.evaluate((el: any) => (el as HTMLAnchorElement).href) || '';
              title = await element.evaluate((el: any) => {
                const text = el.textContent?.trim() || '';
                // <mark> 태그가 있는 경우 텍스트만 추출
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = el.innerHTML;
                return tempDiv.textContent?.trim() || text;
              }) || '';
            } catch (e) {
              console.log(`⚠️ ${i + 1}: 직접 링크 추출 실패`);
            }
          }
          
          // 방법 2: 부모 요소에서 제목 영역 찾기
          if (!url || !title) {
            try {
              const titleElement = await element.$('a.title_link, a[href*="cafe.naver.com"]');
              if (titleElement) {
                url = await titleElement.evaluate((el: any) => (el as HTMLAnchorElement).href) || '';
                title = await titleElement.evaluate((el: any) => {
                  const text = el.textContent?.trim() || '';
                  // <mark> 태그 제거
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = el.innerHTML;
                  return tempDiv.textContent?.trim() || text;
                }) || '';
              }
            } catch (e) {
              console.log(`⚠️ ${i + 1}: 부모 요소에서 제목 추출 실패`);
            }
          }
          
          // 카페명 추출 (실제 구조에서는 URL에서 추출 가능)
          if (url && url.includes('cafe.naver.com')) {
            try {
              const urlParts = url.split('/');
              if (urlParts.length > 3) {
                cafeName = urlParts[3]; // cafe.naver.com/CAFE_NAME/... 형태
              }
            } catch (e) {
              console.log(`⚠️ ${i + 1}: 카페명 추출 실패`);
            }
          }
          
          // 유효성 검사
          if (!title || !url || !url.includes('cafe.naver.com')) {
            console.log(`⚠️ ${i + 1}/${actualMaxPosts}: 제목 또는 카페 URL 누락 (title: "${title?.substring(0, 50)}", url: "${url}")`);
            continue;
          }
          
          console.log(`📄 ${i + 1}/${actualMaxPosts}: "${title?.substring(0, 30)}..." 수집 중...`);
          
          // 새 탭에서 카페글 스크린샷만 촬영 (최적화된 메서드 사용)
          const detailedPost = await this.extractDetailedCafePostOptimized(page, url, title.replace(/\s+/g, ' ').trim(), keyword);
          
          if (detailedPost) {
            posts.push(detailedPost);
            console.log(`✅ ${i + 1}/${actualMaxPosts}: 카페글 수집 완료`);
          } else {
            console.log(`❌ ${i + 1}/${actualMaxPosts}: 카페글 수집 실패`);
          }
          
          // 요청 간 딜레이
          await this.humanDelay();

        } catch (error) {
          console.error(`❌ ${i + 1}/${actualMaxPosts}: 카페글 처리 오류:`, error);
          continue;
        }
      }

      console.log(`🎉 카페 글 추출 완료: ${posts.length}개 성공`);

    } catch (error) {
      console.error('❌ 카페 글 추출 오류:', error);
    }

    return posts;
  }

  /**
   * 카페글 스크린샷만 촬영하는 최적화된 메서드
   */
  private async extractDetailedCafePostOptimized(page: Page, cafeUrl: string, preExtractedTitle: string, keyword: string): Promise<CafePost | null> {
    try {
      console.log(`📋 카페글 상세 내용 수집 중: ${cafeUrl}`);
      
      // 새 탭에서 카페글 열기 (쿠키와 세션 공유)
      const browser = page.browser();
      if (!browser) {
        console.log('⚠️ 브라우저 인스턴스 없음');
        return null;
      }
      
      // 동일한 브라우저 컨텍스트에서 새 페이지 생성 (세션 공유)
      const newPage = await browser.newPage();
      if (!newPage) {
        console.log('⚠️ 새 페이지 생성 실패');
        return null;
      }
      
      try {
        await newPage.goto(cafeUrl, { waitUntil: 'networkidle0', timeout: 100000 });
        await this.humanDelay();
        
        // 검색 결과에서 추출한 제목을 그대로 사용 (더 정확하고 안전함)
        const finalTitle = preExtractedTitle;
        console.log(`📝 검색 결과 제목 사용: "${finalTitle}"`);
        
        // 스크린샷 촬영
        console.log('📸 카페글 스크린샷 촬영 중...');
        const screenshotData = await this.takeAndSaveScreenshot(newPage, keyword, cafeUrl);
        
        // 새 탭 닫기
        await newPage.close();
        
                 return {
           title: finalTitle,
           content: '스크린샷으로 대체', // 내용은 스크린샷으로 대체
           author: '',
           postDate: new Date().toISOString(),
           url: cafeUrl,
           cafeName: '',
           keyword: keyword,
           screenshot: screenshotData.base64, // 호환성을 위해 유지
           screenshotPath: screenshotData.filePath, // 새로운 파일 경로
           imgurUrl: screenshotData.imgurUrl, // imgur URL
           scrapedAt: new Date(),
         };
        
      } catch (pageError) {
        console.error(`❌ 카페글 상세 수집 오류: ${pageError}`);
        await newPage.close();
        return null;
      }
      
    } catch (error) {
      console.error(`❌ 카페글 상세 처리 전체 오류: ${error}`);
      return null;
    }
  }

  /**
   * 카페 글 상세 내용 추출 (개별 페이지 방문) - 기존 메서드
   */
  private async extractDetailedCafePost(page: Page, cafeUrl: string, basicPost: CafePost): Promise<CafePost | null> {
    try {
      console.log(`📋 카페글 상세 내용 수집 중: ${cafeUrl}`);
      
      // 새 탭에서 카페글 열기
      const newPage = await page.browser()?.newPage();
      if (!newPage) {
        console.log('⚠️ 새 페이지 생성 실패');
        return basicPost;
      }
      
      try {
        await newPage.goto(cafeUrl, { waitUntil: 'networkidle0', timeout: 10000 });
        await this.humanDelay();
        
        // 제목 재추출 (더 정확한 제목)
        const detailedTitle = await newPage.evaluate(() => {
          // 먼저 정상 카페글에서 제목 추출 시도
          const titleSelectors = [
            'h3.title_text',           // 가장 우선 순위
            '.se-title-text',
            '.title_text', 
            '.subject',
            'h2.title_text',
            '.post_title',
            '.article_title',
            'h1',
            'h2',
            'h3'
          ];
          
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent?.trim()) {
              const title = element.textContent.trim();
              // 제목이 충분히 길고 정상적인 경우
              if (title.length > 2) {
                return title;
              }
            }
          }
          
          // 제목을 찾지 못한 경우, 비공개/오류 상황인지 확인
          const bodyText = document.body.textContent || '';
          const specificErrorMessages = [
            '죄송합니다. 이 카페는',
            '회원만 가입할 수 있습니다',
            '접근할 수 없습니다',
            '권한이 없습니다',
            '삭제된 게시글입니다',
            '존재하지 않는 게시글입니다'
          ];
          
          const hasSpecificError = specificErrorMessages.some(msg => bodyText.includes(msg));
          
          if (hasSpecificError) {
            // 오류 상황에서는 URL에서 제목 추출 시도
            const titleFromUrl = window.location.href.match(/articleid=(\d+)/)?.[1] || '';
            return titleFromUrl ? `카페글 ${titleFromUrl}` : '접근 제한된 카페글';
          }
          
          // 마지막으로 document.title에서 추출 (카페명 제거)
          const docTitle = document.title;
          const cleanTitle = docTitle.replace(/: 네이버 카페$/, '').replace(/\s*-\s*.*카페.*$/, '');
          return cleanTitle.length > 2 ? cleanTitle : '제목 없음';
        });
        
        // 내용 추출 (비공개 카페 처리)
        const detailedContent = await newPage.evaluate(() => {
          const bodyText = document.body.textContent || '';
          const errorMessages = ['죄송합니다', '회원만', '가입할 수 있습니다'];
          
          if (errorMessages.some(msg => bodyText.includes(msg))) {
            return '비공개 카페로 인해 내용을 확인할 수 없습니다.';
          }
          
          const contentSelectors = [
            '.se-main-container', 
            '.post_content', 
            '.content', 
            '.se-component', 
            '.post_ct',
            '.article_viewer',
            '#postViewArea'
          ];
          
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent?.trim()) {
              return element.textContent.trim().substring(0, 1000);
            }
          }
          return '';
        });
        
        // 작성자 추출
        const author = await newPage.evaluate(() => {
          const authorSelectors = ['.nickname', '.writer', '.author', '.userid', '.profile_info .nick'];
          for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
          return '';
        });
        
        // 작성일 추출
        const postDate = await newPage.evaluate(() => {
          const dateSelectors = ['.date', '.write_time', '.post_date', '.time', '.article_info .date'];
          for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
          return '';
        });
        
        // 전체 페이지 스크린샷 (파일로 저장)
        console.log(`📸 카페글 스크린샷 촬영 중...`);
        const screenshotData = await this.takeAndSaveScreenshot(newPage, basicPost.keyword, cafeUrl);
        
        await newPage.close();
        
        return {
          ...basicPost,
          title: detailedTitle || basicPost.title,
          content: detailedContent || basicPost.content,
          author: author || basicPost.author,
          postDate: postDate || basicPost.postDate,
          screenshot: screenshotData.base64, // 호환성을 위해 유지
          screenshotPath: screenshotData.filePath, // 새로운 파일 경로
          imgurUrl: screenshotData.imgurUrl, // imgur URL
        };
        
      } catch (pageError) {
        console.error(`❌ 카페글 상세 수집 오류: ${pageError}`);
        await newPage.close();
        return basicPost;
      }
      
    } catch (error) {
      console.error(`❌ 카페글 상세 처리 전체 오류: ${error}`);
      return basicPost;
    }
  }

  /**
   * 스크린샷 촬영 및 파일 저장
   */
  private async takeAndSaveScreenshot(page: Page, keyword: string, url: string): Promise<{
    base64: string;
    filePath: string;
    imgurUrl: string;
  }> {
    try {
      // screenshots 디렉토리 생성
      const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
      await fs.mkdir(screenshotsDir, { recursive: true });
      
      // 파일명 생성 (키워드_타임스탬프.png)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanKeyword = keyword.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const fileName = `${cleanKeyword}_${timestamp}.png`;
      const filePath = path.join(screenshotsDir, fileName);
      const publicPath = `/screenshots/${fileName}`;
      
      // 스크린샷 촬영 (버퍼로 저장)
      const screenshotBuffer = await page.screenshot({ 
        fullPage: true,
        type: 'png'
      });
      
      // 파일로 저장
      await fs.writeFile(filePath, screenshotBuffer);
      console.log(`💾 스크린샷 파일 저장: ${publicPath}`);
      
      // base64 변환 (호환성 및 imgur 업로드용)
      const base64 = Buffer.from(screenshotBuffer).toString('base64');
      
      // imgur 업로드
      const imgurUrl = await this.uploadToImgur(base64);
      
      return {
        base64: base64,
        filePath: publicPath,
        imgurUrl: imgurUrl
      };
      
    } catch (error) {
      console.error('❌ 스크린샷 저장 오류:', error);
      return {
        base64: '',
        filePath: '',
        imgurUrl: ''
      };
    }
  }

  /**
   * 스크린샷을 imgur에 업로드
   */
  private async uploadToImgur(base64Image: string): Promise<string> {
    try {
      console.log('📤 imgur 업로드 시도 중...');
      
      // 여러 익명 클라이언트 ID 시도
      const clientIds = [
        '546c25a59c58ad7', // 기본 익명 ID
        'c9a6efb3d7932fd', // 백업 ID 1
        'f0ea04148a54268'  // 백업 ID 2
      ];
      
      for (let i = 0; i < clientIds.length; i++) {
        try {
          const response = await axios.post('https://api.imgur.com/3/image', {
            image: base64Image,
            type: 'base64',
            title: '카페글 스크린샷',
            description: '네이버 카페글 자동 수집'
          }, {
            headers: {
              'Authorization': `Client-ID ${clientIds[i]}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30초 타임아웃
          });
          
          if (response.data.success && response.data.data.link) {
            const imgurUrl = response.data.data.link;
            console.log(`✅ imgur 업로드 성공 (클라이언트 ${i + 1}): ${imgurUrl}`);
            return imgurUrl;
          }
          
        } catch (clientError) {
          console.log(`⚠️ 클라이언트 ID ${i + 1} 실패, 다음 시도...`);
          if (i === clientIds.length - 1) {
            throw clientError;
          }
        }
      }
      
      console.error('❌ 모든 imgur 클라이언트 ID 실패');
      return '';
      
    } catch (error) {
      console.error('❌ imgur 업로드 오류:', error);
      
      // 실패하더라도 로컬 base64는 유지하여 나중에 처리할 수 있도록 함
      if (error instanceof Error) {
        console.log('💾 imgur 업로드 실패 - 로컬 스크린샷으로 대체');
      }
      
      return ''; // 빈 문자열 반환으로 오류 처리
    }
  }

  /**
   * 인간적인 지연시간
   */
  private async humanDelay(): Promise<void> {
    const { min, max } = this.config.delayRange;
    
    // fast 모드일 때는 매우 짧은 지연만 적용
    if (this.config.mode === 'fast') {
      const delay = 100 + Math.random() * 200; // 100-300ms
      await new Promise(resolve => setTimeout(resolve, delay));
      return;
    }
    
    const delay = min + Math.random() * (max - min);
    const preciseDelay = Math.round(delay * 100) / 100;
    
    await new Promise(resolve => setTimeout(resolve, preciseDelay));
  }

  /**
   * 인간적인 타이핑
   */
  private async humanType(page: Page, selector: string, text: string): Promise<void> {
    await page.focus(selector);
    await page.evaluate(selector => {
      const element = document.querySelector(selector) as HTMLInputElement;
      if (element) element.value = '';
    }, selector);

    for (const char of text) {
      await page.type(selector, char, { delay: 120 + Math.random() * 80 });
    }
  }

  /**
   * 인간적인 클릭
   */
  private async humanClick(page: Page, selector: string): Promise<void> {
    // 10% 확률로 실수 패턴
    if (Math.random() < 0.1) {
      await page.click('body', { 
        button: 'left',
        offset: { x: Math.random() * 100, y: Math.random() * 100 }
      });
      await this.humanDelay();
    }

    await page.click(selector);
  }

  /**
   * 브라우저 연결 해제
   */
  async disconnect(): Promise<void> {
    // CDP 연결은 브라우저를 종료하지 않고 연결만 해제
    if (this.browser) {
      await this.browser.disconnect();
      this.browser = null;
      console.log('🔌 브라우저 연결이 해제되었습니다.');
    }
  }

  /**
   * 브라우저 상태 확인
   */
  isConnected(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }
} 