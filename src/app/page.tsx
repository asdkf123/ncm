'use client';

import { useState, useEffect } from 'react';
// import Link from 'next/link'; // 현재 사용하지 않음

// Toast 타입 정의
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// Toast 컨텍스트
let toastId = 0;
let setGlobalToasts: ((toasts: Toast[] | ((prev: Toast[]) => Toast[])) => void) | null = null;

// Toast 함수들
const showToast = (message: string, type: Toast['type'] = 'info', duration = 5000) => {
  if (!setGlobalToasts) return;

  const id = ++toastId;
  const toast: Toast = { id, message, type, duration };

  setGlobalToasts(prev => [...prev, toast]);

  if (duration > 0) {
    setTimeout(() => {
      if (setGlobalToasts) {
        setGlobalToasts(prev => prev.filter(t => t.id !== id));
      }
    }, duration);
  }
};

const removeToast = (id: number) => {
  if (!setGlobalToasts) return;
  setGlobalToasts(prev => prev.filter(t => t.id !== id));
};

// Toast 컴포넌트
const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setGlobalToasts = setToasts;
    return () => {
      setGlobalToasts = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full px-4 py-3 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out
            ${toast.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border-blue-400 text-blue-800' : ''}
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {toast.type === 'success' && <span className="text-green-400">✅</span>}
              {toast.type === 'error' && <span className="text-red-400">❌</span>}
              {toast.type === 'warning' && <span className="text-yellow-400">⚠️</span>}
              {toast.type === 'info' && <span className="text-blue-400">ℹ️</span>}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium whitespace-pre-line">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeToast(toast.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <span className="sr-only">닫기</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 툴팁 컴포넌트
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 w-64 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg origin-top">
        <div className="break-words">{text}</div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
      </div>
    </div>
  );
};

// 제목과 퀘스천 마크 컴포넌트
const TitleWithTooltip = ({ title, tooltip, className = "text-2xl font-bold text-slate-800" }: {
  title: string;
  tooltip: string;
  className?: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <h2 className={className}>{title}</h2>
      <Tooltip text={tooltip}>
        <div className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
          <span className="text-slate-600 text-xs font-bold">?</span>
        </div>
      </Tooltip>
    </div>
  );
};

// 섹션 제목과 퀘스천 마크 컴포넌트
const SectionTitleWithTooltip = ({ title, tooltip, className = "text-xl font-semibold text-slate-800" }: {
  title: string;
  tooltip: string;
  className?: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <h3 className={className}>{title}</h3>
      <Tooltip text={tooltip}>
        <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
          <span className="text-slate-600 text-xs font-bold">?</span>
        </div>
      </Tooltip>
    </div>
  );
};

// 컴포넌트들
const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: '대시보드' },
    { id: 'keywords', icon: '🔍', label: '키워드' },
    { id: 'settings', icon: '⚙️', label: '설정' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 shadow-lg h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-8">모니터링</h1>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${activeTab === item.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

const DashboardTab = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const [scrapingStatus, setScrapingStatus] = useState('idle');
  const [stats, setStats] = useState({
    totalKeywords: 0,
    activeKeywords: 0,
    todayCollected: 0,
    totalCollected: 0,
    thisWeekCollected: 0,
    thisMonthCollected: 0,
  });
  const [activities, setActivities] = useState<Array<{ id: number; message: string; timestamp: string }>>([]);
  const [activeKeywords, setActiveKeywords] = useState<Array<{ id: string; term: string; category: string }>>([]);
  const [loading, setLoading] = useState(false);

  // 수집 관련 상태 추가
  const [scrapingMode, setScrapingMode] = useState('normal');
  const [newsCount, setNewsCount] = useState(10);
  const [cafeCount, setCafeCount] = useState(5);
  const [cafeEnabled, setCafeEnabled] = useState(true);
  const [browserStatus, setBrowserStatus] = useState({
    chromeConnected: false,
    naverLoggedIn: false,
    portOpen: false,
  });

  // 날짜 설정 관련 상태 추가
  const [dateRange, setDateRange] = useState(7); // 스크래핑 날짜 범위 (일)
  const [statisticsPeriod, setStatisticsPeriod] = useState('week'); // 통계 기간
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 카페 검색 커스텀 날짜 관련 상태 추가
  const [cafeeDateMode, setCafeDateMode] = useState<'preset' | 'custom'>('preset');
  const [cafeCustomStartDate, setCafeCustomStartDate] = useState('');
  const [cafeCustomEndDate, setCafeCustomEndDate] = useState('');

  // Chrome 제어 관련 상태 추가
  const [showChromeGuide, setShowChromeGuide] = useState(false);
  const [chromeStatus, setChromeStatus] = useState({
    isRunning: false,
    pid: null,
    port: 9222,
    startTime: null,
  });
  const [chromeLoading, setChromeLoading] = useState(false);

  // 스크래핑 설정 로드
  const loadScrapingSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();
      if (result.success && result.data.scraping) {
        setNewsCount(result.data.scraping.newsCount);
        setCafeCount(result.data.scraping.cafeCount);
        setCafeEnabled(result.data.scraping.cafeEnabled);
      }
    } catch (error) {
      console.error('스크래핑 설정 로드 실패:', error);
    }
  };

  // 통계 데이터 로드
  const loadStats = async () => {
    setLoading(true);
    try {
      // 통계 API 쿼리 파라미터 구성
      const statisticsUrl = new URL('/api/statistics', window.location.origin);
      statisticsUrl.searchParams.set('period', statisticsPeriod);
      if (statisticsPeriod === 'custom' && customStartDate && customEndDate) {
        statisticsUrl.searchParams.set('startDate', customStartDate);
        statisticsUrl.searchParams.set('endDate', customEndDate);
      }

      // 키워드 통계와 Notion 통계를 병렬로 로드
      const [keywordsResponse, statisticsResponse] = await Promise.all([
        fetch('/api/keywords'),
        fetch(statisticsUrl.toString())
      ]);

      const keywordsResult = await keywordsResponse.json();
      const statisticsResult = await statisticsResponse.json();

      if (keywordsResult.success) {
        const keywords = keywordsResult.data;
        const activeKeywordsList = keywords.filter((k: { active: boolean }) => k.active);

        // Notion 통계 사용 (성공 시) 또는 기본값 사용
        const notionStats = statisticsResult.success ? statisticsResult.statistics : {
          todayCollected: 0,
          totalCollected: 0
        };

        setStats({
          totalKeywords: keywords.length,
          activeKeywords: activeKeywordsList.length,
          todayCollected: notionStats.todayCollected,
          totalCollected: notionStats.totalCollected,
          thisWeekCollected: notionStats.thisWeekCollected || 0,
          thisMonthCollected: notionStats.thisMonthCollected || 0,
        });

        // 활성 키워드 목록 업데이트
        setActiveKeywords(activeKeywordsList);

        // 최근 활동도 업데이트 (있는 경우)
        if (statisticsResult.success && statisticsResult.recentActivity) {
          const formattedActivities = statisticsResult.recentActivity.map((activity: any, index: number) => ({
            id: Date.now() + index,
            message: `${activity.type === 'cafe' ? '카페' : '뉴스'}: ${activity.title}${activity.keyword ? ` (${activity.keyword})` : ''}`,
            timestamp: new Date(activity.collectedAt).toLocaleTimeString(),
          }));
          setActivities(formattedActivities);
        }
      }
    } catch (error) {
      console.error('통계 로딩 실패:', error);
      // 에러 발생 시 기본값으로 대체
      setStats(prev => ({
        ...prev,
        todayCollected: 0,
        totalCollected: 0,
        thisWeekCollected: 0,
        thisMonthCollected: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  // 스크래핑 시작
  const handleStartScraping = async () => {
    try {
      setLoading(true);
      setScrapingStatus('running');

      // 커스텀 날짜 범위 설정
      const customRange = cafeeDateMode === 'custom' && cafeCustomStartDate && cafeCustomEndDate
        ? { startDate: cafeCustomStartDate, endDate: cafeCustomEndDate }
        : undefined;

      const response = await fetch('/api/scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: scrapingMode,
          testMode: false,
          dateRange: cafeeDateMode === 'preset' ? dateRange : 7, // 기본 옵션일 때만 사용
          customRange // 커스텀 날짜 범위 추가
        }),
      });

      const result = await response.json();
      if (result.success) {
        const summary = result.data?.summary;
        const totalItems = summary?.totalItems || 0;
        const duration = summary?.duration || 0;

        if (totalItems > 0) {
          showToast(`스크래핑이 완료되었습니다!\n수집된 데이터: ${totalItems}개\n소요 시간: ${duration}초`, 'success');
          addActivity(`스크래핑 완료 - ${totalItems}개 수집됨 (${duration}초 소요)`);
        } else {
          showToast('스크래핑은 완료되었지만 새로운 데이터를 찾지 못했습니다.\n로그인 상태나 네트워크를 확인해주세요.', 'warning');
          addActivity(`스크래핑 완료 - 수집된 데이터 없음`);
        }

        setScrapingStatus('idle');
        // 통계 다시 로드
        setTimeout(loadStats, 1000);
      } else {
        const errorMsg = result.error || '스크래핑에 실패했습니다.';
        showToast(`스크래핑 실패: ${errorMsg}`, 'error');
        addActivity(`스크래핑 실패: ${errorMsg}`);
        setScrapingStatus('error');
      }
    } catch (error) {
      console.error('스크래핑 시작 실패:', error);
      showToast('스크래핑 시작에 실패했습니다.', 'error');
      setScrapingStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // 테스트 실행
  const handleTestScraping = async () => {
    try {
      setLoading(true);

      // 커스텀 날짜 범위 설정
      const customRange = cafeeDateMode === 'custom' && cafeCustomStartDate && cafeCustomEndDate
        ? { startDate: cafeCustomStartDate, endDate: cafeCustomEndDate }
        : undefined;

      const response = await fetch('/api/scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: scrapingMode,
          testMode: true,
          dateRange: cafeeDateMode === 'preset' ? dateRange : 7, // 기본 옵션일 때만 사용
          customRange // 커스텀 날짜 범위 추가
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast('테스트 실행이 완료되었습니다!', 'success');
        addActivity(`테스트 스크래핑 실행됨 (${scrapingMode} 모드)`);
      } else {
        showToast(result.error || '테스트 실행에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('테스트 실행 실패:', error);
      showToast('테스트 실행에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 스크래핑 중지
  const handleStopScraping = () => {
    setScrapingStatus('idle');
    addActivity('스크래핑 작업 중지됨');
    showToast('스크래핑이 중지되었습니다.', 'info');
  };

  // 활동 로그 추가
  const addActivity = (message: string) => {
    const newActivity = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 4)]); // 최대 5개 유지
  };

  // 브라우저 상태 확인
  const checkBrowserStatus = async () => {
    try {
      const response = await fetch('/api/browser-status');
      const result = await response.json();

      if (result.success) {
        setBrowserStatus({
          chromeConnected: result.data.chromeConnected,
          naverLoggedIn: result.data.naverLoggedIn,
          portOpen: result.data.portOpen,
        });
      } else {
        setBrowserStatus({
          chromeConnected: false,
          naverLoggedIn: false,
          portOpen: false,
        });
      }
    } catch (error) {
      console.error('브라우저 상태 확인 실패:', error);
      setBrowserStatus({
        chromeConnected: false,
        naverLoggedIn: false,
        portOpen: false,
      });
    }
  };

  // 수집 모드 저장
  const handleModeChange = (mode: string) => {
    setScrapingMode(mode);
    localStorage.setItem('scraping-mode', mode);
  };

  // 스크래핑 설정 저장
  const saveScrapingSettings = async (newNewsCount: number, newCafeCount: number, newCafeEnabled: boolean) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scraping',
          newsCount: newNewsCount,
          cafeCount: newCafeCount,
          cafeEnabled: newCafeEnabled,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNewsCount(newNewsCount);
        setCafeCount(newCafeCount);
        setCafeEnabled(newCafeEnabled);
        console.log('스크래핑 설정 저장 완료');
      } else {
        console.error('스크래핑 설정 저장 실패:', result.error);
      }
    } catch (error) {
      console.error('스크래핑 설정 저장 오류:', error);
    }
  };

  // 뉴스 수집 개수 변경 처리
  const handleNewsCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 100) {
      saveScrapingSettings(newCount, cafeCount, cafeEnabled);
    }
  };

  // 카페 수집 개수 변경 처리
  const handleCafeCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 50) {
      saveScrapingSettings(newsCount, newCount, cafeEnabled);
    }
  };

  // 카페 활성화 토글
  const handleCafeEnabledToggle = () => {
    saveScrapingSettings(newsCount, cafeCount, !cafeEnabled);
  };

  // Chrome 상태 확인
  const checkChromeStatus = async () => {
    try {
      const response = await fetch('/api/chrome');
      const result = await response.json();

      if (result.success) {
        setChromeStatus(result.data);
      }
    } catch (error) {
      console.error('Chrome 상태 확인 실패:', error);
    }
  };

  // Chrome 시작
  const handleStartChrome = async () => {
    try {
      setChromeLoading(true);
      const response = await fetch('/api/chrome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      const result = await response.json();
      if (result.success) {
        showToast(result.message, 'success');
        await checkChromeStatus();
      } else {
        showToast(result.message || 'Chrome 실행에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Chrome 시작 실패:', error);
      showToast('Chrome 시작에 실패했습니다.', 'error');
    } finally {
      setChromeLoading(false);
    }
  };

  // Chrome 종료
  const handleStopChrome = async () => {
    try {
      setChromeLoading(true);
      const response = await fetch('/api/chrome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      const result = await response.json();
      if (result.success) {
        showToast(result.message, 'success');
        await checkChromeStatus();
      } else {
        showToast(result.message || 'Chrome 종료에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Chrome 종료 실패:', error);
      showToast('Chrome 종료에 실패했습니다.', 'error');
    } finally {
      setChromeLoading(false);
    }
  };

  // 상태 표시 함수들
  const getStatusIcon = (status: boolean) => {
    return status ? '✅ 연결됨' : '❌ 연결 안됨';
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    loadStats();
    checkBrowserStatus();
    checkChromeStatus();

    // 저장된 수집 설정 로드
    const savedMode = localStorage.getItem('scraping-mode');
    if (savedMode) {
      setScrapingMode(savedMode);
    }
    // 전역 설정에서 스크래핑 설정 로드
    loadScrapingSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* 헤더 - 통계 기간 설정 및 새로고침 버튼 포함 */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <TitleWithTooltip
          title="대시보드"
          tooltip="실시간 키워드 현황, 수집 통계, 스크래핑 제어 기능을 제공하는 메인 대시보드입니다."
        />

        {/* 통계 기간 설정과 새로고침 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* 통계 표시 기간 설정 */}
          <div className="flex gap-4 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              {/* <label className="text-slate-700 font-medium text-sm">통계 표시 기간</label> */}
              <Tooltip text="대시보드에서 표시할 통계의 기준 기간을 설정합니다. 커스텀을 선택하면 원하는 날짜 범위를 설정할 수 있습니다.">
                <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
                  <span className="text-slate-600 text-xs font-bold">?</span>
                </div>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statisticsPeriod}
                onChange={(e) => setStatisticsPeriod(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
                <option value="custom">커스텀 기간</option>
              </select>
              {statisticsPeriod === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 focus:outline-none text-sm"
                    placeholder="시작일"
                  />
                  <span className="text-slate-500">~</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1.5 border border-slate-300 rounded focus:border-blue-500 focus:outline-none text-sm"
                    placeholder="종료일"
                  />
                </>
              )}
            </div>
          </div>

          {/* 새로고침 버튼 */}
          <Tooltip text="통계 데이터를 즉시 새로고침합니다. 통계 기간 변경 후 이 버튼을 눌러 반영하세요.">
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              <span>🔄</span>
              {loading ? '업데이트 중...' : '통계 새로고침'}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 상태 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Tooltip text="키워드 탭에서 등록된 전체 키워드의 개수입니다. 활성/비활성 상태와 관계없이 모든 키워드를 포함합니다.">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">총 키워드</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalKeywords}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🔍</span>
              </div>
            </div>
          </div>
        </Tooltip>

        <Tooltip text="현재 활성화되어 스크래핑 대상이 되는 키워드의 개수입니다. 수집 시작 시 이 키워드들을 대상으로 뉴스와 카페글을 수집합니다.">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">활성 키워드</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeKeywords}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 text-xl">✅</span>
              </div>
            </div>
          </div>
        </Tooltip>

        <Tooltip text="오늘 하루 동안 Notion 데이터베이스에 수집된 뉴스와 카페글의 총 개수입니다. 날짜 필드를 기준으로 집계됩니다.">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">오늘 수집</p>
                <p className="text-2xl font-bold text-slate-800">{stats.todayCollected}</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <span className="text-violet-600 text-xl">📈</span>
              </div>
            </div>
          </div>
        </Tooltip>

        <Tooltip text="지금까지 Notion 데이터베이스에 수집된 모든 뉴스와 카페글의 총 개수입니다. 중복 제거된 실제 저장 건수를 나타냅니다.">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">총 수집량</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalCollected}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 text-xl">💾</span>
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      {/* 수집 컨트롤 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <SectionTitleWithTooltip
            title="수집 제어"
            tooltip="활성 키워드에 대해 네이버 뉴스와 카페글을 수집하는 스크래핑 작업을 제어합니다."
          />
          <Tooltip text={`현재 스크래핑 상태: ${scrapingStatus === 'running' ? '실행 중 - 스크래핑이 진행되고 있습니다' : scrapingStatus === 'error' ? '오류 - 스크래핑 중 문제가 발생했습니다' : '대기 중 - 스크래핑이 중지된 상태입니다'}`}>
            <div className="flex items-center space-x-2 cursor-help">
              <div className={`w-3 h-3 rounded-full ${scrapingStatus === 'running' ? 'bg-green-500' :
                  scrapingStatus === 'error' ? 'bg-red-500' : 'bg-slate-400'
                }`}></div>
              <span className="text-slate-600 text-sm">
                {scrapingStatus === 'running' ? '실행 중' :
                  scrapingStatus === 'error' ? '오류' : '대기 중'}
              </span>
            </div>
          </Tooltip>
        </div>

        {/* 수집 개수 설정 */}
        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <label className="text-slate-700 font-medium">수집 개수 설정:</label>
            <Tooltip text="키워드당 수집할 뉴스와 카페글의 개수를 각각 설정합니다. 많을수록 더 많은 데이터를 수집하지만 시간이 오래 걸립니다.">
              <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
                <span className="text-slate-600 text-xs font-bold">?</span>
              </div>
            </Tooltip>
          </div>

          {/* 뉴스 수집 개수 */}
          <div className="flex items-center gap-4 mb-3">
            <label className="text-slate-600 w-20">📰 뉴스:</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNewsCountChange(newsCount - 1)}
                disabled={newsCount <= 1}
                className="w-8 h-8 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 rounded flex items-center justify-center transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="100"
                value={newsCount}
                onChange={(e) => handleNewsCountChange(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => handleNewsCountChange(newsCount + 1)}
                disabled={newsCount >= 100}
                className="w-8 h-8 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 rounded flex items-center justify-center transition-colors"
              >
                +
              </button>
              <span className="text-slate-600 text-sm">개 (1-100)</span>
            </div>
          </div>

          {/* 카페 수집 개수 */}
          <div className="flex items-center gap-4 mb-3">
            <label className="text-slate-600 w-20">☕ 카페:</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCafeCountChange(cafeCount - 1)}
                disabled={cafeCount <= 1 || !cafeEnabled}
                className="w-8 h-8 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 rounded flex items-center justify-center transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={cafeCount}
                disabled={!cafeEnabled}
                onChange={(e) => handleCafeCountChange(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
              <button
                onClick={() => handleCafeCountChange(cafeCount + 1)}
                disabled={cafeCount >= 50 || !cafeEnabled}
                className="w-8 h-8 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 rounded flex items-center justify-center transition-colors"
              >
                +
              </button>
              <span className="text-slate-600 text-sm">개 (1-50)</span>
              <label className="flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={cafeEnabled}
                  onChange={handleCafeEnabledToggle}
                  className="mr-2"
                />
                <span className="text-slate-600 text-sm">활성화</span>
              </label>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            💡 뉴스 {newsCount}개, 카페 {cafeEnabled ? cafeCount : 0}개씩 수집됩니다.
          </p>
        </div>

        {/* 스크래핑 날짜 범위 설정 */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-slate-700 font-medium">스크래핑 날짜 범위:</label>
            <Tooltip text="수집할 뉴스 및 카페글의 발행일 기준으로 최근 몇 일까지의 데이터를 가져올지 설정합니다.">
              <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
                <span className="text-slate-600 text-xs font-bold">?</span>
              </div>
            </Tooltip>
          </div>
          
          {/* 기간 모드 선택 */}
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="dateMode"
                value="preset"
                checked={cafeeDateMode === 'preset'}
                onChange={(e) => setCafeDateMode(e.target.value as 'preset' | 'custom')}
                className="mr-2"
              />
              <span className="text-slate-700">기본 옵션</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="dateMode"
                value="custom"
                checked={cafeeDateMode === 'custom'}
                onChange={(e) => setCafeDateMode(e.target.value as 'preset' | 'custom')}
                className="mr-2"
              />
              <span className="text-slate-700">직접 입력</span>
            </label>
          </div>

          {/* 기본 옵션 선택 */}
          {cafeeDateMode === 'preset' && (
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
            >
              <option value={1 / 24}>1시간</option>
              <option value={1}>1일</option>
              <option value={7}>1주</option>
              <option value={30}>1개월</option>
              <option value={90}>3개월</option>
              <option value={180}>6개월</option>
              <option value={365}>1년</option>
            </select>
          )}

          {/* 직접 입력 */}
          {cafeeDateMode === 'custom' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">시작일</label>
                  <input
                    type="date"
                    value={cafeCustomStartDate}
                    onChange={(e) => setCafeCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">종료일</label>
                  <input
                    type="date"
                    value={cafeCustomEndDate}
                    onChange={(e) => setCafeCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              {cafeCustomStartDate && cafeCustomEndDate && (
                <p className="text-xs text-blue-600">
                  📅 선택된 기간: {cafeCustomStartDate} ~ {cafeCustomEndDate}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-slate-600 mt-2">
            {cafeeDateMode === 'preset' 
              ? `📅 현재 수집 범위: 최근 ${dateRange}일` 
              : '📅 카페글은 직접 입력된 날짜 범위로, 뉴스는 기본 7일 범위로 수집됩니다.'
            }
          </p>
        </div>

        <div className="flex space-x-4">
          <Tooltip text="설정된 모드와 개수로 실제 스크래핑을 시작합니다. 수집된 데이터는 Notion 데이터베이스에 저장됩니다.">
            <button
              onClick={handleStartScraping}
              disabled={loading || scrapingStatus === 'running'}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {loading ? '시작 중...' : `수집 시작 (뉴스 ${newsCount}개, 카페 ${cafeEnabled ? cafeCount : 0}개)`}
            </button>
          </Tooltip>
          <Tooltip text="Notion 저장 없이 스크래핑을 테스트합니다. 수집 기능이 정상 작동하는지 확인할 때 사용하세요.">
            <button
              onClick={handleTestScraping}
              disabled={loading}
              className="bg-slate-500 hover:bg-slate-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {loading ? '실행 중...' : '테스트 실행'}
            </button>
          </Tooltip>
          <Tooltip text="진행 중인 스크래핑 작업을 즉시 중지합니다. 현재 수집 중인 항목은 완료되지 않습니다.">
            <button
              onClick={handleStopScraping}
              disabled={scrapingStatus !== 'running'}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              중지
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 수집 설정 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 수집 모드 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SectionTitleWithTooltip
            title="수집 모드"
            tooltip="스크래핑 속도와 안전성을 조절합니다. 느릴수록 안전하고, 빠를수록 탐지 위험이 높아집니다."
          />
          <div className="flex flex-col space-y-3 mt-4">
            <Tooltip text="가장 안전한 모드로 2-5분 간격으로 수집합니다. 탐지 위험이 최소화되어 장기간 운영에 적합합니다.">
              <label className="flex items-center cursor-help">
                <input
                  type="radio"
                  name="mode"
                  value="safe"
                  checked={scrapingMode === 'safe'}
                  onChange={(e) => handleModeChange(e.target.value)}
                  className="text-blue-600"
                />
                <span className="ml-3 text-slate-700">🛡️ 안전 모드 (2-5분 간격)</span>
              </label>
            </Tooltip>
            <Tooltip text="균형잡힌 모드로 30초-3분 간격으로 수집합니다. 속도와 안전성을 모두 고려한 권장 모드입니다.">
              <label className="flex items-center cursor-help">
                <input
                  type="radio"
                  name="mode"
                  value="normal"
                  checked={scrapingMode === 'normal'}
                  onChange={(e) => handleModeChange(e.target.value)}
                  className="text-blue-600"
                />
                <span className="ml-3 text-slate-700">⚡ 일반 모드 (30초-3분 간격)</span>
              </label>
            </Tooltip>
            <Tooltip text="가장 빠른 모드로 15초-1분 간격으로 수집합니다. 빠른 수집이 가능하지만 탐지 위험이 높아 단기간만 사용하세요.">
              <label className="flex items-center cursor-help">
                <input
                  type="radio"
                  name="mode"
                  value="fast"
                  checked={scrapingMode === 'fast'}
                  onChange={(e) => handleModeChange(e.target.value)}
                  className="text-blue-600"
                />
                <span className="ml-3 text-slate-700">🚨 긴급 모드 (15초-1분 간격)</span>
              </label>
            </Tooltip>
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              현재 선택: <strong>
                {scrapingMode === 'safe' && '안전 모드'}
                {scrapingMode === 'normal' && '일반 모드'}
                {scrapingMode === 'fast' && '긴급 모드'}
              </strong>
            </p>
          </div>
        </div>

        {/* 브라우저 연결 상태 (설정에서 이동) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <SectionTitleWithTooltip
              title="브라우저 연결 상태"
              tooltip="카페 스크래핑을 위한 Chrome 브라우저 연결 상태와 네이버 로그인 상태를 확인합니다."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowChromeGuide(!showChromeGuide)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {showChromeGuide ? '수동 가이드 숨기기' : '⚙️ 수동 실행 가이드'}
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Chrome 디버그 포트</span>
              <span className="text-slate-500">포트 9222</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">포트 연결 상태</span>
              <span className={getStatusColor(browserStatus.portOpen)}>{getStatusIcon(browserStatus.portOpen)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Chrome 브라우저</span>
              <span className={getStatusColor(browserStatus.chromeConnected)}>{getStatusIcon(browserStatus.chromeConnected)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Chrome 프로세스</span>
              <span className={getStatusColor(chromeStatus.isRunning)}>
                {chromeStatus.isRunning ? `✅ 실행 중 (PID: ${chromeStatus.pid})` : '❌ 중지됨'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">네이버 로그인</span>
              <span className={browserStatus.naverLoggedIn ? 'text-green-600' : 'text-amber-600'}>
                {browserStatus.naverLoggedIn ? '✅ 로그인됨' : '⚠️ 로그인 필요'}
              </span>
            </div>
          </div>

          {/* Chrome 자동 제어 버튼들 */}
          <div className="flex gap-3 mb-4">
            {!chromeStatus.isRunning ? (
              <button
                onClick={handleStartChrome}
                disabled={chromeLoading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-4 py-3 rounded-lg transition-colors shadow-sm font-medium"
              >
                {chromeLoading ? '🔄 실행 중...' : '🚀 Chrome 자동 실행'}
              </button>
            ) : (
              <button
                onClick={handleStopChrome}
                disabled={chromeLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-3 rounded-lg transition-colors shadow-sm font-medium"
              >
                {chromeLoading ? '🔄 종료 중...' : '⏹️ Chrome 종료'}
              </button>
            )}

            <button
              onClick={() => {
                checkBrowserStatus();
                checkChromeStatus();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors shadow-sm"
            >
              🔄 상태 확인
            </button>
          </div>

          {/* 자동 실행 안내 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-emerald-900 mb-2">🎯 원클릭 Chrome 실행</h5>
            <p className="text-emerald-800 text-sm">
              <strong>"🚀 Chrome 자동 실행"</strong> 버튼을 클릭하면:<br />
              ✅ Chrome이 자동으로 디버그 모드로 실행됩니다<br />
              ✅ naver.com이 자동으로 열립니다<br />
              ✅ 네이버에 로그인만 하면 스크래핑 준비 완료!
            </p>
          </div>

          {/* 수동 실행 가이드 */}
          {showChromeGuide && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">⚙️ 수동 실행 방법 (자동 실행 실패시)</h4>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                <p className="text-amber-800 text-sm">
                  💡 <strong>참고:</strong> 위의 자동 실행 버튼이 작동하지 않을 경우에만 아래 방법을 사용하세요.
                </p>
              </div>

              {/* macOS */}
              <div className="mb-4">
                <h5 className="font-medium text-slate-700 mb-2">🍎 macOS</h5>
                <div className="bg-slate-800 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
                </div>
              </div>

              {/* Windows */}
              <div className="mb-4">
                <h5 className="font-medium text-slate-700 mb-2">🪟 Windows</h5>
                <div className="bg-slate-800 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                  "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
                </div>
              </div>

              {/* Linux */}
              <div className="mb-4">
                <h5 className="font-medium text-slate-700 mb-2">🐧 Linux</h5>
                <div className="bg-slate-800 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                  google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 활성 키워드 현황 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800">활성 키워드 현황</h3>
          <span className="text-sm text-slate-500">수집 중인 키워드들</span>
        </div>
        <div className="space-y-3">
          {activeKeywords.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              활성화된 키워드가 없습니다.
              <br />
              <span
                className="text-blue-500 hover:text-blue-600 cursor-pointer"
                onClick={() => setActiveTab('keywords')}
              >
                키워드 탭
              </span>에서 키워드를 추가하고 활성화하세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeKeywords.map((keyword) => (
                <div key={keyword.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{keyword.term}</h4>
                      <p className="text-sm text-slate-500">{keyword.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        활성
                      </span>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">최근 활동</h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              아직 활동 기록이 없습니다.
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700">{activity.message}</span>
                </div>
                <span className="text-slate-500 text-sm">{activity.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const KeywordsTab = () => {
  const [keywords, setKeywords] = useState<Array<{ id: string; term: string; category: string; active: boolean }>>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState({ term: '', category: '' });

  // 키워드 목록 로드
  const loadKeywords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/keywords');
      const result = await response.json();
      if (result.success) {
        setKeywords(result.data);
      }
    } catch (error) {
      console.error('키워드 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 키워드 추가
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.term.trim() || !newKeyword.category.trim()) {
      showToast('키워드와 카테고리를 입력해주세요.', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyword),
      });

      const result = await response.json();
      if (result.success) {
        setKeywords([...keywords, result.data]);
        setNewKeyword({ term: '', category: '' });
        setShowAddForm(false);
        showToast('키워드가 추가되었습니다!', 'success');
      } else {
        showToast(result.error || '키워드 추가에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('키워드 추가 실패:', error);
      showToast('키워드 추가에 실패했습니다.', 'error');
    }
  };

  // 키워드 삭제
  const handleDeleteKeyword = async (id: string, term: string) => {
    if (!confirm(`"${term}" 키워드를 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setKeywords(keywords.filter(k => k.id !== id));
        showToast('키워드가 삭제되었습니다!', 'success');
      } else {
        showToast(result.error || '키워드 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('키워드 삭제 실패:', error);
      showToast('키워드 삭제에 실패했습니다.', 'error');
    }
  };

  // 키워드 토글
  const handleToggleKeyword = async (id: string) => {
    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });

      const result = await response.json();
      if (result.success) {
        setKeywords(keywords.map(k => k.id === id ? result.data : k));
        showToast(result.message, 'success');
      } else {
        showToast(result.error || '상태 변경에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('키워드 토글 실패:', error);
      showToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  // 컴포넌트 마운트시 키워드 로드
  useEffect(() => {
    loadKeywords();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TitleWithTooltip
          title="키워드 관리"
          tooltip="스크래핑할 키워드를 등록, 관리하고 활성/비활성 상태를 설정합니다."
        />
        <Tooltip text="새로운 키워드를 추가합니다. 키워드, 카테고리를 설정할 수 있습니다.">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            + 키워드 추가
          </button>
        </Tooltip>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddKeyword} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SectionTitleWithTooltip
            title="새 키워드 추가"
            tooltip="스크래핑할 새로운 키워드를 등록합니다. 키워드와 카테고리는 필수 입력 항목입니다."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Tooltip text="검색할 키워드를 입력하세요. 예: 부동산, 주식, 암호화폐 등">
              <input
                type="text"
                inputMode="text"
                placeholder="키워드 (예: 부동산, 주식)"
                value={newKeyword.term}
                onChange={(e) => setNewKeyword({ ...newKeyword, term: e.target.value })}
                className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                required
              />
            </Tooltip>
            <Tooltip text="키워드를 분류할 카테고리를 입력하세요. 예: 경제, 부동산, 주식 등">
              <input
                type="text"
                placeholder="카테고리"
                value={newKeyword.category}
                onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                required
              />
            </Tooltip>
          </div>
          <div className="mt-3 text-sm text-slate-600">
            💡 수집량은 설정 탭에서 일괄 관리됩니다.
          </div>
          <div className="flex space-x-3 mt-4">
            <Tooltip text="키워드를 추가하고 활성 상태로 등록합니다.">
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
                추가
              </button>
            </Tooltip>
            <Tooltip text="키워드 추가를 취소하고 폼을 닫습니다.">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                취소
              </button>
            </Tooltip>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left text-slate-700 px-6 py-3 font-semibold">
                <Tooltip text="스크래핑할 검색어">
                  <span className="cursor-help">키워드</span>
                </Tooltip>
              </th>
              <th className="text-left text-slate-700 px-6 py-3 font-semibold">
                <Tooltip text="키워드를 분류하는 카테고리">
                  <span className="cursor-help">카테고리</span>
                </Tooltip>
              </th>
              <th className="text-left text-slate-700 px-6 py-3 font-semibold">
                <Tooltip text="키워드의 활성/비활성 상태. 활성화된 키워드만 스크래핑됩니다.">
                  <span className="cursor-help">상태</span>
                </Tooltip>
              </th>

              <th className="text-left text-slate-700 px-6 py-3 font-semibold">
                <Tooltip text="키워드 삭제 버튼">
                  <span className="cursor-help">액션</span>
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  키워드를 불러오는 중...
                </td>
              </tr>
            ) : keywords.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  등록된 키워드가 없습니다. 새 키워드를 추가해보세요!
                </td>
              </tr>
            ) : (
              keywords.map((keyword) => (
                <tr key={keyword.id} className="border-t border-slate-200">
                  <td className="px-6 py-4 text-slate-800 font-medium">{keyword.term}</td>
                  <td className="px-6 py-4 text-slate-600">{keyword.category}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleKeyword(keyword.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${keyword.active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                      {keyword.active ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteKeyword(keyword.id, keyword.term)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const SettingsTab = () => {
  const [settings, setSettings] = useState({
    naverClientId: '',
    naverClientSecret: '',
    notionApiKey: '',
    notionDatabaseId: '',
  });
  const [loading, setLoading] = useState(false);

  // 설정 로드 (JSON 파일에서)
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();

      if (result.success) {
        const apiSettings = result.data.api;
        setSettings({
          naverClientId: apiSettings.naverClientId || '',
          naverClientSecret: apiSettings.naverClientSecret || '',
          notionApiKey: apiSettings.notionApiKey || '',
          notionDatabaseId: apiSettings.notionDatabaseId || '',
        });
      }
    } catch (error) {
      console.error('설정 로딩 실패:', error);
    }
  };

  // 설정 저장 (JSON 파일에)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        showToast('🎉 API 설정이 성공적으로 저장되었습니다!\n\n✅ data/settings.json 파일에 저장됨\n✅ 서버 재시작 없이 바로 적용됨', 'success');
      } else {
        showToast(`설정 저장 실패: ${result.error}`, 'error');
        if (result.details && result.details.length > 0) {
          showToast(`오류 상세:\n${result.details.join('\n')}`, 'error');
        }
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      showToast('설정 저장에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트시 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);



  return (
    <div className="space-y-6">
      <TitleWithTooltip
        title="설정"
        tooltip="네이버 API와 Notion API 키를 설정하고 관리합니다."
      />

      <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <SectionTitleWithTooltip
          title="API 설정"
          tooltip="스크래핑과 데이터 저장에 필요한 API 키들을 설정합니다. JSON 파일로 저장되어 서버에서 사용됩니다."
        />
        {/* <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <p className="text-emerald-800 text-sm">
            ✅ <strong>JSON 파일 저장:</strong> 설정이 <code>data/settings.json</code> 파일에 저장됩니다.<br/>
            🔄 서버 재시작 없이 바로 적용되며, 백엔드 API에서 실제로 사용됩니다.
          </p>
        </div> */}
        <div className="space-y-4 mt-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-slate-700 text-sm font-medium">네이버 클라이언트 ID</label>
              <Tooltip text="네이버 개발자 센터에서 발급받은 클라이언트 ID입니다. 뉴스 API 사용에 필요합니다.">
                <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
                  <span className="text-slate-600 text-xs font-bold">?</span>
                </div>
              </Tooltip>
            </div>
            <Tooltip text="https://developers.naver.com/apps/ 에서 애플리케이션 등록 후 발급받은 클라이언트 ID를 입력하세요.">
              <input
                type="text"
                placeholder="네이버 클라이언트 ID를 입력하세요"
                value={settings.naverClientId}
                onChange={(e) => setSettings({ ...settings, naverClientId: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
              />
            </Tooltip>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-slate-700 text-sm font-medium">네이버 클라이언트 시크릿</label>
              <Tooltip text="네이버 개발자 센터에서 발급받은 클라이언트 시크릿입니다. 보안상 중요한 정보입니다.">
                <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
                  <span className="text-slate-600 text-xs font-bold">?</span>
                </div>
              </Tooltip>
            </div>
            <Tooltip text="네이버 개발자 센터에서 발급받은 클라이언트 시크릿을 입력하세요. 외부에 노출되지 않도록 주의하세요.">
              <input
                type="password"
                placeholder="네이버 클라이언트 시크릿을 입력하세요"
                value={settings.naverClientSecret}
                onChange={(e) => setSettings({ ...settings, naverClientSecret: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
              />
            </Tooltip>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-slate-700 text-sm font-medium">Notion API 키</label>
              <Tooltip text="Notion에서 발급받은 인테그레이션 API 키입니다. 데이터베이스 접근에 필요합니다.">
                <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
                  <span className="text-slate-600 text-xs font-bold">?</span>
                </div>
              </Tooltip>
            </div>
            <Tooltip text="https://developers.notion.com/ 에서 인테그레이션을 생성하고 발급받은 API 키를 입력하세요.">
              <input
                type="password"
                placeholder="Notion API 키를 입력하세요"
                value={settings.notionApiKey}
                onChange={(e) => setSettings({ ...settings, notionApiKey: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
              />
            </Tooltip>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-slate-700 text-sm font-medium">Notion 데이터베이스 ID</label>
              <Tooltip text="수집된 데이터를 저장할 Notion 데이터베이스의 고유 ID입니다.">
                <div className="w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center cursor-help transition-colors">
                  <span className="text-slate-600 text-xs font-bold">?</span>
                </div>
              </Tooltip>
            </div>
            <Tooltip text="데이터를 저장할 Notion 데이터베이스 URL에서 추출한 ID를 입력하세요. 한국어 칼럼명을 사용하는 데이터베이스여야 합니다.">
              <input
                type="text"
                placeholder="Notion 데이터베이스 ID를 입력하세요"
                value={settings.notionDatabaseId}
                onChange={(e) => setSettings({ ...settings, notionDatabaseId: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
              />
            </Tooltip>
          </div>
          <Tooltip text="모든 API 설정을 JSON 파일로 저장합니다. 서버 재시작 없이 바로 적용됩니다.">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {loading ? '저장 중...' : '💾 설정 저장 (JSON 파일)'}
            </button>
          </Tooltip>
        </div>
      </form>



      {/* JSON 설정 상태 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <SectionTitleWithTooltip
          title="현재 JSON 설정 상태"
          tooltip="JSON 파일에 저장된 API 설정의 현재 상태를 확인합니다. ✅는 설정됨, ❌는 설정되지 않음을 의미합니다."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">네이버 Client ID:</span>
            <span className="ml-2 text-slate-800">{settings.naverClientId ? '✅ 설정됨' : '❌ 없음'}</span>
          </div>
          <div>
            <span className="text-slate-600">네이버 Client Secret:</span>
            <span className="ml-2 text-slate-800">{settings.naverClientSecret ? '✅ 설정됨' : '❌ 없음'}</span>
          </div>
          <div>
            <span className="text-slate-600">Notion API Key:</span>
            <span className="ml-2 text-slate-800">{settings.notionApiKey ? '✅ 설정됨' : '❌ 없음'}</span>
          </div>
          <div>
            <span className="text-slate-600">Notion Database ID:</span>
            <span className="ml-2 text-slate-800">{settings.notionDatabaseId ? '✅ 설정됨' : '❌ 없음'}</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-slate-600 text-xs">
            💾 저장 위치: <code className="bg-slate-200 px-1 rounded">data/settings.json</code><br />
            🔄 마지막 업데이트: 페이지 로드 시점
          </p>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab setActiveTab={setActiveTab} />;
      case 'keywords':
        return <KeywordsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
