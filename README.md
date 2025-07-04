# 🤖 시장 반응 모니터링 봇

네이버 뉴스와 카페글을 자동으로 수집하여 시장 동향을 파악하고 Notion 데이터베이스에 체계적으로 저장하는 자동화 시스템입니다.

## ✨ 주요 기능

### 📰 네이버 뉴스 자동 수집

- 네이버 뉴스 API를 통한 키워드별 뉴스 수집
- 날짜 범위 및 수집 개수 설정 가능 (전역 설정)
- HTML 태그 제거 및 데이터 정제

### ☕ 네이버 카페글 스크래핑

- MCP Playwright + Puppeteer를 활용한 안전한 스크래핑
- Chrome DevTools Protocol (CDP) 기반 브라우저 연결
- 인간적 패턴으로 탐지 회피 (지연시간, 마우스 움직임, 실수 패턴)
- **🆕 기간 직접입력 기능**:
  - 기본 옵션 (1시간/1일/1주/1개월 등) 및 직접입력 모드 지원
  - 시작일~종료일 커스텀 날짜 범위 설정 가능
  - 네이버 카페 검색 UI 직접 조작으로 정확한 기간 필터링
  - 년/월/일 드롭다운을 통한 정밀한 날짜 설정
  - **개선된 UI 접근**: "옵션" 버튼 자동 클릭으로 기간 설정 UI 활성화
  - **견고한 선택자 시스템**: 다중 선택자 시도로 안정적인 요소 찾기
- **개선된 스크린샷 시스템**:
  - 검색 결과에서 제목 미리 추출 (더 정확한 제목)
  - 상세 페이지에서 스크린샷만 촬영 (효율성 향상)
  - 로컬 PNG 파일 저장 (`public/screenshots/`)
  - 자동 imgur 업로드 및 3중 백업 시스템
- 비공개 카페 감지 및 적절한 오류 처리
- 메모리 효율적인 이미지 처리 (base64 → 파일 버퍼)
- **개선된 타임아웃 처리**: 페이지 이동 타임아웃 100초로 설정
- **✨ 최적화된 중복 검사**: 스크린샷 촬영 전 중복 검사로 불필요한 작업 방지

### 📝 Notion 자동 저장

- 수집된 데이터를 Notion 데이터베이스에 자동 저장
- 중복 검사 및 카테고리별 분류
- 뉴스/카페글 구분 저장
- **개선된 이미지 관리**:
  - imgur URL 우선 저장 (외부 접근 가능)
  - 로컬 파일 경로 백업 (`/screenshots/파일명.png`)
  - base64 데이터 호환성 유지
- 한국어 칼럼명 지원 및 날짜 기반 통계 제공
- 직관적인 툴팁 도움말 시스템
- **Toast 알림 시스템**:
  - 모든 결과를 우아한 Toast로 표시
  - 성공/경고/오류별 컬러 구분
  - 자동 닫힘 및 수동 닫기 기능

### 🔍 키워드 관리 시스템

- JSON 파일 기반 키워드 저장
- 카테고리별 키워드 분류
- 일괄 수집 설정 (뉴스/카페 개수, 카페 활성화 여부)
- **🆕 유연한 날짜 범위 설정**:
  - 기본 옵션: 1시간~1년 프리셋 선택
  - 직접입력: 정확한 시작일/종료일 지정
  - 뉴스는 기본 7일, 카페는 커스텀 범위 개별 적용
- 웹 UI를 통한 쉬운 관리

### ⏰ 스케줄링 자동화

- 4가지 수집 모드: 안전/일반/긴급/Fast
- 수동 실행 및 테스트 모드 지원
- 로컬 환경에서 실행
- 상세한 진행상황 로그 및 에러 추적

## 🏗️ 기술 스택

- **프론트엔드**: Next.js 15, TypeScript, Tailwind CSS
- **백엔드**: Next.js API Routes, Node.js
- **스크래핑**: Puppeteer (CDP 래퍼) + Chrome DevTools Protocol
- **데이터베이스**: Notion API, JSON 파일
- **상태 관리**: Zustand
- **실행 환경**: 로컬 개발 환경

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 통합 대시보드 (메인 페이지)
│   └── api/                # API 라우트
│       ├── scraping/       # 스크래핑 API
│       └── keywords/       # 키워드 관리 API
├── lib/                    # 유틸리티 라이브러리
│   ├── mcp-playwright.ts   # Puppeteer CDP 클라이언트
│   ├── naver-api.ts        # 네이버 API 클라이언트
│   ├── notion-client.ts    # Notion API 클라이언트
│   └── keyword-manager.ts  # 키워드 관리
├── types/                  # TypeScript 타입 정의
│   ├── scraping.ts         # 스크래핑 관련 타입
│   ├── keyword.ts          # 키워드 관련 타입
│   └── notion.ts           # Notion 관련 타입
├── data/                   # 데이터 저장소
│   ├── keywords.json       # 키워드 설정 파일
│   └── settings.json       # 전역 설정 파일 (API, 스크래핑 설정)
└── public/screenshots/     # 스크린샷 파일 저장소 (PNG 파일)
```

## 🚀 설치 및 실행

### 0. 시스템 요구사항

#### Node.js 설치
- **권장 버전**: Node.js 18.0 이상 (현재 테스트 버전: v22.9.0)
- **npm 버전**: 9.0 이상 (Node.js와 함께 자동 설치됨)

**다운로드 링크**: [nodejs.org](https://nodejs.org/)

#### 운영체제별 권장사항

**🪟 Windows 사용자:**
```bash
# 설치 확인
node --version   # v18.0.0 이상
npm --version    # 9.0.0 이상

# npm 속도 개선 (선택사항)
npm config set registry https://registry.npmjs.org/
npm install -g npm@latest
```

**🍎 macOS 사용자:**
```bash
# Homebrew로 설치 (권장)
brew install node

# 설치 확인
node --version
npm --version
```

**🐧 Linux 사용자:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/asdkf123/ncm.git
cd ncm
npm install
```

**⏰ 설치 시간**: 윈도우에서 5-10분, macOS/Linux에서 2-5분 소요될 수 있습니다.

#### 🪟 윈도우에서 npm 설치 속도 개선 팁

```bash
# 1. npm 캐시 정리
npm cache clean --force

# 2. npm 설정 최적화
npm config set fund false
npm config set audit false

# 3. 병렬 설치 활성화
npm config set maxsockets 15

# 4. 설치 시 상세 로그 확인 (문제 발생 시)
npm install --verbose
```

**⚠️ 윈도우 사용자 주의사항:**
- 바이러스 검사 소프트웨어가 설치를 느리게 할 수 있습니다
- 가능하면 관리자 권한으로 터미널 실행
- `node_modules` 폴더를 바이러스 검사 제외 목록에 추가 권장

### 2. 설정 파일 구성

#### 환경변수 설정

`.env` 파일에 다음 설정을 추가하세요:

```env
# 네이버 뉴스 API (https://developers.naver.com/apps/)
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret

# Notion API (https://developers.notion.com/)
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id

# Chrome 디버그 설정
CHROME_DEBUG_PORT=9222
CHROME_DEBUG_HOST=localhost
```

#### 데이터 파일 설정

1. **설정 파일 생성**:
   ```bash
   cp data/settings.example.json data/settings.json
   ```

2. **키워드 파일 생성**:
   ```bash
   cp data/keywords.example.json data/keywords.json
   ```

3. **설정 파일 수정**:
   - `data/settings.json`에서 API 키 정보 입력
   - `data/keywords.json`에서 모니터링할 키워드 추가

### 3. Chrome 디버그 모드 실행

카페 스크래핑을 위해 Chrome을 디버그 모드로 실행하세요:

```bash
# macOS/Linux
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Windows
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

### 4. 네이버 로그인

1. Chrome 디버그 모드에서 `naver.com` 접속
2. 수동으로 로그인 (카페 접근 권한 확보)
3. 로그인 상태 유지

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속하세요.

## 🔒 보안 주의사항

- **민감한 정보 보호**: `data/settings.json`, `data/keywords.json`, `.env` 파일은 git에 추가하지 마세요
- **API 키 관리**: 네이버 API 키와 Notion API 키는 절대 공개하지 마세요
- **개인정보**: 개인적인 키워드나 설정 정보는 예시 파일을 사용하세요

## 🎯 기간 직접입력 기능 사용법

### 1. 스크래핑 날짜 범위 설정

대시보드에서 "스크래핑 날짜 범위" 섹션을 찾으세요:

- **기본 옵션**: 1시간, 1일, 1주, 1개월, 3개월, 6개월, 1년 중 선택
- **직접 입력**: 시작일과 종료일을 정확히 지정

### 2. 직접입력 모드 사용하기

1. "직접 입력" 라디오 버튼 선택
2. 시작일 날짜 선택 (YYYY-MM-DD 형식)
3. 종료일 날짜 선택 (YYYY-MM-DD 형식)
4. "스크래핑 시작" 버튼 클릭

### 3. 작동 원리

- **뉴스 수집**: 네이버 뉴스 API는 항상 기본 7일 범위 사용
- **카페 수집**: 지정된 커스텀 날짜 범위로 정확한 기간 필터링
- **UI 조작 프로세스**: 
  1. 네이버 카페 검색 결과 페이지에서 "옵션" 버튼 클릭
  2. 옵션 패널이 열리면 "직접입력" 버튼 자동 클릭
  3. 캘린더 UI에서 년/월/일 드롭다운 정확히 설정
  4. 적용 버튼 클릭으로 기간 필터링 완료

### 4. 예시 시나리오

```
시작일: 2024-12-01
종료일: 2024-12-31
→ 2024년 12월 한 달간의 카페글만 정확히 수집
```

### 5. 트러블슈팅

#### 기간 설정 실패 시
- **현상**: "❌ 커스텀 날짜 범위 설정 실패" 로그 출력
- **원인**: 네이버 UI 구조 변경 또는 네트워크 지연
- **해결방법**: 
  1. Chrome 디버그 모드가 정상 실행 중인지 확인
  2. 네이버 로그인 상태 확인
  3. 네트워크 연결 상태 확인
  4. 재시도 또는 기본 기간 옵션 사용

#### "옵션" 버튼을 찾을 수 없음
- **현상**: "⚠️ 옵션 버튼을 찾을 수 없습니다" 로그 출력
- **원인**: 네이버 카페 검색 UI 변경
- **해결방법**: 기간 설정 없이 진행 (전체 기간으로 검색)

### 6. Notion 데이터베이스 설정

Notion에서 다음과 같은 속성들을 가진 데이터베이스를 생성하세요:

| 속성명    | 속성 타입     | 설명                    |
| --------- | ------------- | ----------------------- |
| 제목      | 제목          | 뉴스/카페글 제목        |
| 유형      | 선택          | 'news' 또는 'cafe'      |
| 키워드    | **다중 선택** | 검색에 사용된 키워드    |
| 내용      | 텍스트        | 뉴스 요약/카페글 내용   |
| 기사 링크 | URL           | 뉴스 기사 원문 링크     |
| 카페 링크 | URL           | 카페글 원문 링크        |
| 날짜      | 날짜          | 수집된 날짜 (통계 기준) |
| 발행일    | 날짜          | 뉴스/카페글 원문 발행일 |
| 카페명    | 텍스트        | 카페글의 출처 카페명    |

⚠️ **중요**: '키워드' 필드는 반드시 **다중 선택(Multi-select)** 타입으로 설정해야 합니다. 텍스트 타입으로 설정하면 저장 오류가 발생합니다.

## 🔧 문제 해결 가이드

### 1. **카페 스크래핑 로그인 오류**

```
⚠️ 네이버 로그인이 필요합니다
```

**해결방법:**

- Chrome 디버그 모드에서 `naver.com` 접속
- 완전히 로그인 (내정보 아이콘이 보일 때까지)
- 로그인 상태 유지 확인 후 스크래핑 재시도

### 2. **Notion 저장 오류**

```
키워드 is expected to be multi_select
```

**해결방법:**

- Notion 데이터베이스에서 '키워드' 필드 타입을 **다중 선택**으로 변경
- 기존 텍스트 타입 데이터가 있다면 삭제 후 재생성

### 3. **뉴스 수집되지만 저장 안됨**

**원인:** 중복 검사로 인한 건너뛰기 또는 Notion 스키마 오류
**해결방법:**

1. 콘솔 로그에서 중복/오류 메시지 확인
2. Notion 데이터베이스 스키마 재확인
3. 테스트 모드로 먼저 실행해보기

### 4. **Notion 저장 충돌 오류**

```
Conflict occurred while saving. Please try again.
```

**원인:** 다수의 아이템을 동시에 저장할 때 Notion API 충돌
**해결방법:**

- 자동 재시도 로직으로 해결 (최대 3회 재시도)
- 순차 저장으로 충돌 방지
- 지수 백오프로 안정성 확보

### 5. **카페 검색 결과 없음**

**원인:** 네이버 카페 검색 페이지 구조 변경
**해결방법:**

1. 네이버 메인에서 수동으로 카페 검색 테스트

### 6. **스크린샷 관련 문제**

**문제:** 카페글 제목이 "접근 제한된 카페글"로 표시됨
**해결방법:**

- 개선된 시스템에서는 검색 결과 페이지에서 제목을 미리 추출합니다
- 접근 제한이 감지되면 자동으로 제목 표시를 업데이트합니다
- 스크린샷은 정상적으로 촬영되어 이미지로 내용을 확인할 수 있습니다

**스크린샷 파일 확인:**

- 로컬 파일: `public/screenshots/키워드_타임스탬프.png`
- imgur URL: Notion에서 바로 확인 가능
- 파일 크기: 평균 3-4MB (full page 스크린샷)

2. 키워드를 더 일반적인 용어로 변경
3. 카페 검색 비활성화 후 뉴스만 수집

### 6. **카페글 제목이 "접근 제한된 카페글"로 표시**

**원인:** 비공개 카페이거나 권한이 없는 카페글
**해결방법:**

1. 해당 카페에 가입 후 재수집
2. 공개 카페의 키워드로 변경
3. 로그에서 실제 카페 URL 확인 후 수동 접근 테스트

### 7. **imgur 스크린샷 업로드 실패**

**원인:** imgur API 제한 또는 네트워크 오류
**해결방법:**

- 로컬 스크린샷은 계속 저장됨 (KB 단위로 크기 표시)
- imgur 업로드 실패해도 전체 수집은 정상 진행
- 여러 클라이언트 ID로 자동 재시도 적용됨

## 📋 사용 방법

### 1. 통합 대시보드 활용

브라우저에서 `localhost:3000`에 접속하면 모든 기능이 통합된 대시보드를 확인할 수 있습니다:

- **좌측 사이드바**: 대시보드/키워드/설정 탭 전환
- **상태 카드**: 실시간 키워드 및 수집 현황 모니터링 (hover로 상세 설명 확인)
- **수집 제어**: 원클릭으로 수집 시작/중지/테스트
- **툴팁 도움말**: 모든 제목과 버튼에 ? 마크로 상세 설명 제공

### 2. 키워드 관리

1. 좌측 사이드바에서 **키워드** 탭 클릭
2. `+ 키워드 추가` 버튼으로 새 키워드 등록
3. 키워드, 카테고리, 수집 개수 설정
4. 테이블에서 키워드 상태 및 수집량 확인

### 3. 날짜 범위 설정

1. **대시보드** 탭에서 수집 제어 패널의 날짜 범위 설정 확인
2. **스크래핑 날짜 범위**: 수집할 뉴스의 발행일 기준 설정
   - 최근 1일, 3일, 1주일, 2주일, 1개월, 3개월 중 선택
3. **통계 표시 기간**: 대시보드 통계의 기준 기간 설정
   - 오늘, 이번 주, 이번 달, 커스텀 기간 중 선택
   - 커스텀 선택 시 시작일/종료일 직접 입력 가능

### 4. 스크래핑 실행

1. **대시보드** 탭에서 수집 제어 패널 확인
2. 날짜 범위와 수집 개수 설정
3. 원하는 모드로 스크래핑 실행:
   - **수집 시작**: 설정된 모드와 날짜 범위로 정식 수집
   - **테스트 실행**: Notion 저장 없이 테스트
   - **중지**: 진행 중인 수집 중단

### 5. 수집 모드 설정

1. **대시보드** 탭에서 수집 모드 선택:
   - **🛡️ 안전 모드**: 2-5분 간격 (탐지 위험 최소화)
   - **⚡ 일반 모드**: 30초-3분 간격 (권장)
   - **🚨 긴급 모드**: 10-30초 간격 (빠른 수집, 위험)
   - **⚡ Fast 모드**: 즉시 실행 (대기시간 최소화, 최고 속도)
2. 브라우저 연결 상태 실시간 확인

### 6. API 설정

1. **설정** 탭에서 API 키 설정
2. 네이버 API 키, Notion API 키 입력
3. Notion 데이터베이스 ID 설정

### 7. 결과 확인

- Notion 데이터베이스에서 수집된 데이터 확인
- 카테고리별, 키워드별 분류된 결과 검토
- 대시보드에서 선택한 기간별 통계 확인

## ⚙️ 설정 옵션

### 날짜 범위 설정

| 설정               | 옵션                            | 설명                           |
| ------------------ | ------------------------------- | ------------------------------ |
| 스크래핑 날짜 범위 | 1일/3일/1주일/2주일/1개월/3개월 | 수집할 뉴스의 발행일 기준 범위 |
| 통계 표시 기간     | 오늘/이번 주/이번 달/커스텀     | 대시보드 통계의 기준 기간      |
| 커스텀 기간        | 시작일 ~ 종료일                 | 원하는 날짜 범위 직접 설정     |

### 스크래핑 모드

| 모드 | 지연시간 | 특징             | 권장 사용   |
| ---- | -------- | ---------------- | ----------- |
| 안전 | 2-5분    | 탐지 위험 최소화 | 장기간 운영 |
| 일반 | 30초-3분 | 균형잡힌 수집    | 일반적 사용 |
| 긴급 | 15초-1분 | 빠른 수집        | 단기간만    |

### 인간적 패턴

- **지연시간**: 소수점 포함 랜덤 지연
- **마우스 움직임**: 베지어 곡선 기반 자연스러운 이동
- **실수 패턴**: 10% 확률로 잘못된 클릭
- **읽기 패턴**: 글자 수 기반 읽기 시간 시뮬레이션

## 🔐 보안 및 탐지 회피

### CDP 방식의 장점

- 실제 사용자 브라우저 활용
- WebDriver 탐지 신호 없음
- 정상적인 브라우저 지문
- 로그인 세션 재활용

### 네이버 탐지 회피 전략

1. **브라우저 연결**: 신규 브라우저 실행 대신 기존 브라우저 연결
2. **인간적 패턴**: 다양한 지연시간과 행동 패턴
3. **세션 관리**: 수동 로그인 후 세션 재활용
4. **요청 분산**: 키워드별 충분한 간격 유지

## 🚀 성능 최적화

### 데이터베이스 폴링 제거

- 페이지 접속 시에만 통계 데이터 로드
- 30초 자동 새로고침 기능 제거로 API 호출량 대폭 감소
- 수동 새로고침 버튼을 통한 필요시에만 업데이트

### Notion API 최적화

- 한국어 칼럼명 매핑으로 정확한 데이터 조회
- 중복 검사 시 기사/카페 링크 모두 확인
- 페이지네이션을 통한 대용량 데이터 처리
- 예외 처리로 안정성 향상

### 사용자 경험 개선

- **직관적 툴팁 시스템**: 모든 제목, 버튼, 옵션에 ? 마크와 hover 설명
- **상세한 기능 안내**: 각 수집 모드, API 설정, 키워드 관리 기능 설명
- **실시간 상태 표시**: 브라우저 연결, 스크래핑 진행 상태 시각화
- **사용자 친화적 UI**: 카드 hover 시 상세 정보 제공
- **Toast 알림 시스템**: window.alert 대신 우아한 Toast로 모든 결과 표시
- **최근활동 개선**: 키워드 없음 표시 제거, 깔끔한 활동 로그

## 🛠️ API 문서

### 키워드 관리

- `GET /api/keywords` - 키워드 목록 조회
- `POST /api/keywords` - 키워드 추가
- `PUT /api/keywords/[id]` - 키워드 수정
- `DELETE /api/keywords/[id]` - 키워드 삭제
- `PATCH /api/keywords/[id]` - 키워드 활성화/비활성화

### 스크래핑

- `GET /api/scraping` - 스크래핑 상태 조회
- `POST /api/scraping` - 스크래핑 실행

## 📊 수집 데이터 구조

### 뉴스 데이터

```json
{
  "title": "뉴스 제목",
  "description": "뉴스 요약",
  "url": "원본 링크",
  "source": "언론사",
  "keyword": "검색 키워드",
  "publishedAt": "발행일시",
  "scrapedAt": "수집일시",
  "category": "news"
}
```

### 카페 데이터

```json
{
  "title": "카페글 제목",
  "content": "글 내용",
  "url": "카페글 링크",
  "author": "작성자",
  "cafeName": "카페명",
  "keyword": "검색 키워드",
  "postDate": "작성일시",
  "scrapedAt": "수집일시",
  "screenshot": "스크린샷 base64",
  "category": "cafe"
}
```

## 🚨 주의사항

1. **네이버 이용약관 준수**: 과도한 요청으로 서비스에 부하를 주지 마세요
2. **Chrome 브라우저**: 카페 스크래핑을 위해 Chrome 디버그 모드가 필요합니다
3. **로그인 유지**: 네이버 계정 로그인 상태를 유지해야 카페 접근이 가능합니다
4. **수집 주기**: 안전한 수집을 위해 적절한 지연시간을 설정하세요
5. **개인정보**: 수집된 데이터의 개인정보 보호에 주의하세요

## 🤝 기여

이 프로젝트는 시장 반응 분석을 위한 개인 프로젝트입니다. 개선 사항이나 버그 리포트는 언제든 환영합니다.

## 📄 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다. 상업적 사용 시에는 네이버 API 이용약관을 확인하시기 바랍니다.

---

**💡 Tip**: 처음 사용하시는 경우 테스트 모드로 몇 번 실행해보신 후 본격적인 수집을 시작하세요!
