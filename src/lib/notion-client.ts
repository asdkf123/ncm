import { Client } from '@notionhq/client';
import { NotionEntry, NotionSaveResult } from '@/types/notion';
import { NewsItem, CafePost } from '@/types/scraping';

export class NotionClient {
  private notion: Client;
  private databaseId: string;

  constructor(apiKey?: string, databaseId?: string) {
    // 매개변수로 받은 값이 있으면 사용, 없으면 환경변수 사용
    const notionApiKey = apiKey || process.env.NOTION_API_KEY;
    this.databaseId = databaseId || process.env.NOTION_DATABASE_ID!;

    if (!notionApiKey || !this.databaseId) {
      throw new Error('Notion API 키 또는 데이터베이스 ID가 설정되지 않았습니다.');
    }

    this.notion = new Client({
      auth: notionApiKey,
    });
  }

  /**
   * 뉴스 항목을 Notion에 저장
   */
  async saveNewsItem(newsItem: NewsItem): Promise<NotionSaveResult> {
    try {
      console.log(`📝 뉴스 Notion 저장 시도: ${newsItem.title.substring(0, 50)}...`);
      
      // 뉴스는 중복이 드물어 저장 시에만 검사 (기존 방식 유지)
      const isDuplicate = await this.checkDuplicate(newsItem.title, newsItem.link);
      if (isDuplicate) {
        console.log(`⚠️ 중복된 뉴스 발견: ${newsItem.title.substring(0, 50)}...`);
        return {
          success: true,
          duplicateFound: true,
        };
      }

      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          '제목': {
            title: [
              {
                text: {
                  content: newsItem.title,
                },
              },
            ],
          },
          '유형': {
            select: {
              name: 'news',
            },
          },
          '키워드': {
            multi_select: [
              {
                name: newsItem.keyword,
              },
            ],
          },
          '기사 링크': {
            url: newsItem.originallink || newsItem.link,
          },
          '내용': {
            rich_text: [
              {
                text: {
                  content: newsItem.description.substring(0, 2000), // Notion 제한
                },
              },
            ],
          },
          '날짜': {
            date: {
              start: newsItem.scrapedAt.toISOString(),
            },
          },
          '발행일': {
            date: {
              start: new Date(newsItem.pubDate).toISOString(),
            },
          },
        },
      });

      console.log(`✅ 뉴스 Notion 저장 완료: ${newsItem.title.substring(0, 50)}...`);
      return {
        success: true,
        entryId: response.id,
      };

    } catch (error) {
      console.error('❌ Notion 뉴스 저장 오류:', {
        title: newsItem.title.substring(0, 50),
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        keyword: newsItem.keyword,
        link: newsItem.link
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 카페 글을 Notion에 저장
   */
  async saveCafePost(cafePost: CafePost): Promise<NotionSaveResult> {
    try {
      console.log(`📝 카페글 Notion 저장 시도: ${cafePost.title.substring(0, 50)}...`);
      
      // 중복 검사는 스크린샷 촬영 전에 이미 완료됨

      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          '제목': {
            title: [
              {
                text: {
                  content: cafePost.title,
                },
              },
            ],
          },
          '유형': {
            select: {
              name: 'cafe',
            },
          },
          '키워드': {
            multi_select: [
              {
                name: cafePost.keyword,
              },
            ],
          },
          '카페 링크': {
            url: cafePost.url,
          },
          '카페명': {
            rich_text: [
              {
                text: {
                  content: cafePost.cafeName,
                },
              },
            ],
          },
          '내용': {
            rich_text: [
              {
                text: {
                  content: '', // 본문에 이미지가 추가되므로 내용 필드는 비움
                },
              },
            ],
          },
          '날짜': {
            date: {
              start: cafePost.scrapedAt.toISOString(),
            },
          },
          '발행일': {
            date: {
              start: new Date(cafePost.postDate).toISOString(),
            },
          },
        },
      });

      // 페이지 본문에 이미지 블록 추가
      if (cafePost.imgurUrl || cafePost.screenshotPath || cafePost.screenshot) {
        await this.addImageToPageContent(response.id, cafePost);
      }

      console.log(`✅ 카페글 Notion 저장 완료: ${cafePost.title.substring(0, 50)}...`);
      return {
        success: true,
        entryId: response.id,
      };

    } catch (error) {
      console.error('❌ Notion 카페글 저장 오류:', {
        title: cafePost.title.substring(0, 50),
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        keyword: cafePost.keyword,
        cafe: cafePost.cafeName,
        url: cafePost.url
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 페이지 본문에 이미지 블록 추가
   */
  private async addImageToPageContent(pageId: string, cafePost: CafePost): Promise<void> {
    try {
      const children: any[] = [];

      // 제목 및 설명 추가
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '📸 카페글 스크린샷',
              },
            },
          ],
        },
      });

      // 스크린샷 이미지 추가 (우선순위: imgur > 로컬파일)
      if (cafePost.imgurUrl) {
        children.push({
          object: 'block',
          type: 'image',
          image: {
            type: 'external',
            external: {
              url: cafePost.imgurUrl,
            },
            caption: [
              {
                type: 'text',
                text: {
                  content: `${cafePost.title} - 스크린샷`,
                },
              },
            ],
          },
        });
        
        // imgur 링크도 추가
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '🔗 이미지 직접 링크: ',
                },
              },
              {
                type: 'text',
                text: {
                  content: cafePost.imgurUrl,
                  link: {
                    url: cafePost.imgurUrl,
                  },
                },
              },
            ],
          },
        });
      } else if (cafePost.screenshotPath) {
        // 로컬 파일의 경우 웹 접근 가능한 URL로 변환
        const localUrl = `http://localhost:3000${cafePost.screenshotPath}`;
        children.push({
          object: 'block',
          type: 'image',
          image: {
            type: 'external',
            external: {
              url: localUrl,
            },
            caption: [
              {
                type: 'text',
                text: {
                  content: `${cafePost.title} - 로컬 스크린샷`,
                },
              },
            ],
          },
        });
        
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '📁 로컬 파일: ',
                },
              },
              {
                type: 'text',
                text: {
                  content: localUrl,
                  link: {
                    url: localUrl,
                  },
                },
              },
            ],
          },
        });
      }

      // 구분선 추가
      children.push({
        object: 'block',
        type: 'divider',
        divider: {},
      });

      // 원본 링크 정보
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: '🔗 원본 카페글: ',
              },
            },
            {
              type: 'text',
              text: {
                content: cafePost.url,
                link: {
                  url: cafePost.url,
                },
              },
            },
          ],
        },
      });

      if (children.length > 0) {
        await this.notion.blocks.children.append({
          block_id: pageId,
          children: children,
        });
        console.log(`📷 이미지 블록 추가 완료: ${cafePost.title.substring(0, 30)}...`);
      }
    } catch (error) {
      console.error('❌ 이미지 블록 추가 오류:', error);
      // 이미지 추가 실패해도 메인 저장은 성공으로 처리
    }
  }

  /**
   * 카페글 내용 포맷팅 (스크린샷 URL 포함) - 사용 안함 (레거시)
   */
  private formatCafeContent(cafePost: CafePost): string {
    let content = cafePost.content.substring(0, 1700); // 더 많은 여유 공간 확보
    
    // 스크린샷 정보 추가 (우선순위: imgur > 로컬파일 > base64)
    let screenshotText = '';
    if (cafePost.imgurUrl) {
      screenshotText = `\n\n📸 스크린샷: ${cafePost.imgurUrl}`;
    } else if (cafePost.screenshotPath) {
      // 로컬 파일 경로를 웹 접근 가능한 URL로 변환
      const localUrl = `http://localhost:3000${cafePost.screenshotPath}`;
      screenshotText = `\n\n📸 로컬 스크린샷: ${localUrl}`;
    } else if (cafePost.screenshot) {
      screenshotText = `\n\n📸 스크린샷: base64로 저장됨 (${Math.round(cafePost.screenshot.length / 1024)}KB)`;
    }
    
    if (screenshotText) {
      // 내용과 스크린샷 정보가 합쳐져도 2000자를 넘지 않도록 조정
      const maxContentLength = 2000 - screenshotText.length;
      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength - 3) + '...';
      }
      
      content += screenshotText;
    }
    
    return content;
  }

  /**
   * 중복 항목 검사
   */
  private async checkDuplicate(title: string, url: string): Promise<boolean> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          or: [
            {
              property: '제목',
              title: {
                equals: title,
              },
            },
            {
              property: '기사 링크',
              url: {
                equals: url,
              },
            },
            {
              property: '카페 링크',
              url: {
                equals: url,
              },
            },
          ],
        },
      });

      return response.results.length > 0;

    } catch (error) {
      console.error('중복 검사 오류:', error);
      return false; // 오류 시 중복이 아니라고 가정
    }
  }

  /**
   * 외부에서 호출 가능한 중복 검사 (스크린샷 촬영 전 사용)
   */
  async checkDuplicatePublic(title: string, url: string): Promise<boolean> {
    return this.checkDuplicate(title, url);
  }

  /**
   * 대량 저장
   */
  async saveBulk(newsItems: NewsItem[], cafePosts: CafePost[]): Promise<{
    newsResults: NotionSaveResult[];
    cafeResults: NotionSaveResult[];
    summary: {
      totalNews: number;
      totalCafe: number;
      successNews: number;
      successCafe: number;
      duplicatesNews: number;
      duplicatesCafe: number;
    };
  }> {
    console.log(`📦 Notion 대량 저장 시작: 뉴스 ${newsItems.length}개, 카페 ${cafePosts.length}개`);

    // 뉴스 아이템 순차 저장 (충돌 방지)
    const newsResults: NotionSaveResult[] = [];
    for (let i = 0; i < newsItems.length; i++) {
      const item = newsItems[i];
      console.log(`📰 ${i + 1}/${newsItems.length} 뉴스 저장 중...`);
      
      const result = await this.saveNewsItemWithRetry(item);
      newsResults.push(result);
      
      // 저장 간 약간의 지연 (충돌 방지)
      if (i < newsItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // 카페 포스트 순차 저장 (충돌 방지)
    const cafeResults: NotionSaveResult[] = [];
    for (let i = 0; i < cafePosts.length; i++) {
      const post = cafePosts[i];
      console.log(`☕ ${i + 1}/${cafePosts.length} 카페글 저장 중...`);
      
      const result = await this.saveCafePostWithRetry(post);
      cafeResults.push(result);
      
      // 저장 간 약간의 지연 (충돌 방지)
      if (i < cafePosts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const summary = {
      totalNews: newsItems.length,
      totalCafe: cafePosts.length,
      successNews: newsResults.filter(r => r.success && !r.duplicateFound).length,
      successCafe: cafeResults.filter(r => r.success && !r.duplicateFound).length,
      duplicatesNews: newsResults.filter(r => r.duplicateFound).length,
      duplicatesCafe: cafeResults.filter(r => r.duplicateFound).length,
    };

    console.log(`✅ Notion 저장 완료:`, summary);

    return {
      newsResults,
      cafeResults,
      summary,
    };
  }

  /**
   * 재시도 로직이 있는 뉴스 저장
   */
  private async saveNewsItemWithRetry(newsItem: NewsItem, maxRetries: number = 3): Promise<NotionSaveResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.saveNewsItem(newsItem);
      
      // 성공하거나 중복인 경우 바로 반환
      if (result.success || result.duplicateFound) {
        return result;
      }
      
      // 충돌 오류인 경우 재시도
      if (result.error?.includes('Conflict occurred') && attempt < maxRetries) {
        console.log(`🔄 뉴스 저장 재시도 ${attempt}/${maxRetries}: ${newsItem.title.substring(0, 30)}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 지수 백오프
        continue;
      }
      
      // 다른 오류이거나 최대 재시도 횟수 도달 시 결과 반환
      return result;
    }
    
    return {
      success: false,
      error: '최대 재시도 횟수 초과',
    };
  }

  /**
   * 재시도 로직이 있는 카페글 저장
   */
  private async saveCafePostWithRetry(cafePost: CafePost, maxRetries: number = 3): Promise<NotionSaveResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.saveCafePost(cafePost);
      
      // 성공하거나 중복인 경우 바로 반환
      if (result.success || result.duplicateFound) {
        return result;
      }
      
      // 충돌 오류인 경우 재시도
      if (result.error?.includes('Conflict occurred') && attempt < maxRetries) {
        console.log(`🔄 카페글 저장 재시도 ${attempt}/${maxRetries}: ${cafePost.title.substring(0, 30)}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 지수 백오프
        continue;
      }
      
      // 다른 오류이거나 최대 재시도 횟수 도달 시 결과 반환
      return result;
    }
    
    return {
      success: false,
      error: '최대 재시도 횟수 초과',
    };
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.notion.databases.retrieve({
        database_id: this.databaseId,
      });
      return true;
    } catch (error) {
      console.error('Notion 연결 테스트 실패:', error);
      return false;
    }
  }

  /**
   * 수집 통계 조회 (동적 날짜 범위 지원)
   */
  async getStatistics(
    periodType: string = 'week',
    customStartDate?: string | null,
    customEndDate?: string | null
  ): Promise<{
    totalCollected: number;
    todayCollected: number;
    thisWeekCollected: number;
    thisMonthCollected: number;
    customPeriodCollected?: number;
  }> {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // 이번 주 시작일 (월요일)
      const weekStart = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 일요일(0)은 6일 전이 월요일
      weekStart.setDate(today.getDate() - daysToMonday);
      const weekStartString = weekStart.toISOString().split('T')[0];

      // 이번 달 시작일
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartString = monthStart.toISOString().split('T')[0];

      console.log('📊 Notion 통계 조회 중...');
      console.log(`오늘: ${todayString}, 주 시작: ${weekStartString}, 월 시작: ${monthStartString}`);
      
      if (periodType === 'custom' && customStartDate && customEndDate) {
        console.log(`커스텀 기간: ${customStartDate} ~ ${customEndDate}`);
      }

      // 전체 데이터 개수 조회 (모든 페이지 순회)
      let totalCollected = 0;
      let hasMore = true;
      let nextCursor: string | undefined;

      while (hasMore) {
        const result = await this.notion.databases.query({
          database_id: this.databaseId,
          page_size: 100,
          start_cursor: nextCursor,
        });
        
        totalCollected += result.results.length;
        hasMore = result.has_more;
        nextCursor = result.next_cursor || undefined;
      }

      // 오늘 데이터 조회
      let todayCollected = 0;
      try {
        let hasMoreToday = true;
        let nextCursorToday: string | undefined;

        while (hasMoreToday) {
          const todayResult = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
              property: '날짜',
              date: {
                equals: todayString,
              },
            },
            page_size: 100,
            start_cursor: nextCursorToday,
          });
          
          todayCollected += todayResult.results.length;
          hasMoreToday = todayResult.has_more;
          nextCursorToday = todayResult.next_cursor || undefined;
        }
      } catch (error) {
        console.warn('오늘 데이터 조회 실패, 대체 방법 시도:', error);
        // 대체 방법: created_time 사용
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        
        let hasMoreTodayAlt = true;
        let nextCursorTodayAlt: string | undefined;
        todayCollected = 0;

        while (hasMoreTodayAlt) {
          const todayResult = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
              and: [
                {
                  timestamp: 'created_time',
                  created_time: {
                    on_or_after: todayStart.toISOString(),
                  },
                },
                {
                  timestamp: 'created_time',
                  created_time: {
                    before: todayEnd.toISOString(),
                  },
                },
              ],
            },
            page_size: 100,
            start_cursor: nextCursorTodayAlt,
          });
          
          todayCollected += todayResult.results.length;
          hasMoreTodayAlt = todayResult.has_more;
          nextCursorTodayAlt = todayResult.next_cursor || undefined;
        }
      }

      // 이번 주 데이터 조회
      let thisWeekCollected = 0;
      try {
        let hasMoreWeek = true;
        let nextCursorWeek: string | undefined;

        while (hasMoreWeek) {
          const weekResult = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
              property: '날짜',
              date: {
                on_or_after: weekStartString,
              },
            },
            page_size: 100,
            start_cursor: nextCursorWeek,
          });
          
          thisWeekCollected += weekResult.results.length;
          hasMoreWeek = weekResult.has_more;
          nextCursorWeek = weekResult.next_cursor || undefined;
        }
      } catch (error) {
        console.warn('주간 데이터 조회 실패, 기본값 사용:', error);
      }

      // 이번 달 데이터 조회
      let thisMonthCollected = 0;
      try {
        let hasMoreMonth = true;
        let nextCursorMonth: string | undefined;

        while (hasMoreMonth) {
          const monthResult = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
              property: '날짜',
              date: {
                on_or_after: monthStartString,
              },
            },
            page_size: 100,
            start_cursor: nextCursorMonth,
          });
          
          thisMonthCollected += monthResult.results.length;
          hasMoreMonth = monthResult.has_more;
          nextCursorMonth = monthResult.next_cursor || undefined;
        }
      } catch (error) {
        console.warn('월간 데이터 조회 실패, 기본값 사용:', error);
      }

      // 커스텀 기간 데이터 조회 (요청된 경우)
      let customPeriodCollected: number | undefined;
      if (periodType === 'custom' && customStartDate && customEndDate) {
        try {
          let hasMoreCustom = true;
          let nextCursorCustom: string | undefined;
          customPeriodCollected = 0;

          while (hasMoreCustom) {
            const customResult = await this.notion.databases.query({
              database_id: this.databaseId,
              filter: {
                and: [
                  {
                    property: '날짜',
                    date: {
                      on_or_after: customStartDate,
                    },
                  },
                  {
                    property: '날짜',
                    date: {
                      on_or_before: customEndDate,
                    },
                  },
                ],
              },
              page_size: 100,
              start_cursor: nextCursorCustom,
            });
            
            customPeriodCollected += customResult.results.length;
            hasMoreCustom = customResult.has_more;
            nextCursorCustom = customResult.next_cursor || undefined;
          }
        } catch (error) {
          console.warn('커스텀 기간 데이터 조회 실패:', error);
          customPeriodCollected = 0;
        }
      }

      const stats = {
        totalCollected,
        todayCollected,
        thisWeekCollected,
        thisMonthCollected,
        ...(customPeriodCollected !== undefined && { customPeriodCollected }),
      };

      console.log('📈 Notion 통계 결과:', stats);
      return stats;

    } catch (error) {
      console.error('Notion 통계 조회 실패:', error);
      
      // 에러 발생 시 기본값 반환
      return {
        totalCollected: 0,
        todayCollected: 0,
        thisWeekCollected: 0,
        thisMonthCollected: 0,
      };
    }
  }

  /**
   * 최근 수집 활동 조회
   */
  async getRecentActivity(limit: number = 5): Promise<Array<{
    title: string;
    category: string;
    keyword: string;
    collectedAt: Date;
    type: 'news' | 'cafe';
  }>> {
    try {
      const result = await this.notion.databases.query({
        database_id: this.databaseId,
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending',
          },
        ],
        page_size: limit,
      });

      return result.results.map((page: any) => {
        const properties = page.properties;
        
        return {
          title: properties['제목']?.title?.[0]?.plain_text || '제목 없음',
          category: properties['유형']?.select?.name || '카테고리 없음',
          keyword: properties['키워드']?.rich_text?.[0]?.plain_text || '',
          collectedAt: new Date(page.created_time),
          type: (properties['유형']?.select?.name || 'news') === 'cafe' ? 'cafe' : 'news',
        };
      });

    } catch (error) {
      console.error('최근 활동 조회 실패:', error);
      return [];
    }
  }
} 