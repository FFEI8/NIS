'use client';

import { useState, useEffect, ComponentType, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { useConfigStore } from '@/store/config-store';
import { Hospital, RefreshCw, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import LoginPage from '@/components/layout/login-page';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

// Dynamic imports for page components to reduce initial compilation payload
import dynamic from 'next/dynamic';

// Loading fallback component
function PageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
        <div className="text-slate-500 text-sm">加载中...</div>
      </div>
    </div>
  );
}

// ============ Top Loading Bar ============
function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const activeRequestsRef = useRef(0);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      // Only show loading bar for API calls (not static assets)
      if (url.startsWith('/api/')) {
        activeRequestsRef.current++;
        if (activeRequestsRef.current === 1) {
          setLoading(true);
          setComplete(false);
        }
      }

      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        if (url.startsWith('/api/')) {
          activeRequestsRef.current--;
          if (activeRequestsRef.current <= 0) {
            activeRequestsRef.current = 0;
            setComplete(true);
            setTimeout(() => {
              setLoading(false);
              setComplete(false);
            }, 400);
          }
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []); // Empty deps - only patch once, use ref for counter

  if (!loading && !complete) return null;

  return (
    <div className={`loading-bar ${complete ? 'complete' : loading ? 'active' : ''}`} />
  );
}

// Helper to create dynamic import with error recovery
function dynamicPage<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
) {
  return dynamic(importFn, {
    loading: () => <PageLoading />,
    ssr: false,
  });
}

const DashboardPage = dynamicPage(() => import('@/components/pages/dashboard'));
const InfectionCasesPage = dynamicPage(() => import('@/components/pages/infection-cases'));
const WarningsPage = dynamicPage(() => import('@/components/pages/warnings'));
const TargetMonitoringPage = dynamicPage(() => import('@/components/pages/target-monitoring'));
const EnvironmentalMonitorPage = dynamicPage(() => import('@/components/pages/environmental-monitor'));
const SterilizationPage = dynamicPage(() => import('@/components/pages/sterilization'));
const OccupationalExposurePage = dynamicPage(() => import('@/components/pages/occupational-exposure'));
const HandHygienePage = dynamicPage(() => import('@/components/pages/hand-hygiene'));
const AntibioticUsagePage = dynamicPage(() => import('@/components/pages/antibiotic-usage'));
const InfectionReportsPage = dynamicPage(() => import('@/components/pages/infection-reports'));
const StatisticsPage = dynamicPage(() => import('@/components/pages/statistics'));
const UserManagementPage = dynamicPage(() => import('@/components/pages/user-management'));
const RoleManagementPage = dynamicPage(() => import('@/components/pages/role-management'));
const MenuManagementPage = dynamicPage(() => import('@/components/pages/menu-management'));
const PermissionManagementPage = dynamicPage(() => import('@/components/pages/permission-management'));
const InfectiousDiseaseCasePage = dynamicPage(() => import('@/components/pages/infectious-disease-case'));
const ContactTracingPage = dynamicPage(() => import('@/components/pages/contact-tracing'));
const SymptomSurveillancePage = dynamicPage(() => import('@/components/pages/symptom-surveillance'));
const EpidemicDashboardPage = dynamicPage(() => import('@/components/pages/epidemic-dashboard'));
const DiseaseAlertPage = dynamicPage(() => import('@/components/pages/disease-alert'));
const WarningRulesPage = dynamicPage(() => import('@/components/pages/warning-rules'));
const MicroLabResultsPage = dynamicPage(() => import('@/components/pages/micro-lab-results'));
const HISIntegrationAnalysisPage = dynamicPage(() => import('@/components/pages/his-integration-analysis'));
const InfectiousDiseaseTestItemsPage = dynamicPage(() => import('@/components/pages/infectious-disease-test-items'));
const HisTestMappingPage = dynamicPage(() => import('@/components/pages/his-test-mapping'));
const HisFieldMappingPage = dynamicPage(() => import('@/components/pages/his-field-mapping'));
const HisSyncManagementPage = dynamicPage(() => import('@/components/pages/his-sync-management'));

// ============ Content Router ============
function ContentArea() {
  const activeMenu = useAppStore(s => s.activeMenu);

  const pages: Record<string, React.ReactNode> = {
    'dashboard': <DashboardPage />,
    'infection-case': <InfectionCasesPage />,
    'infection-warning': <WarningsPage />,
    'infection-target': <TargetMonitoringPage />,
    'data-statistics': <StatisticsPage />,
    'data-report': <InfectionReportsPage />,
    'env-hygiene': <EnvironmentalMonitorPage />,
    'env-sterilization': <SterilizationPage />,
    'occupational-exposure': <OccupationalExposurePage />,
    'hand-hygiene': <HandHygienePage />,
    'antibiotic': <AntibioticUsagePage />,
    'system-user': <UserManagementPage />,
    'system-role': <RoleManagementPage />,
    'system-menu': <MenuManagementPage />,
    'system-permission': <PermissionManagementPage />,
    'id-case-report': <InfectiousDiseaseCasePage />,
    'id-contact-tracing': <ContactTracingPage />,
    'id-symptom-surveillance': <SymptomSurveillancePage />,
    'id-epidemic-dashboard': <EpidemicDashboardPage />,
    'id-disease-alert': <DiseaseAlertPage />,
    'infection-warning-rules': <WarningRulesPage />,
    'micro-lab-results': <MicroLabResultsPage />,
    'his-integration': <HISIntegrationAnalysisPage />,
    'infectious-disease-test-items': <InfectiousDiseaseTestItemsPage />,
    'his-test-mapping': <HisTestMappingPage />,
    'his-field-mapping': <HisFieldMappingPage />,
    'his-sync-management': <HisSyncManagementPage />,
  };

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-200" key={activeMenu}>
      {pages[activeMenu] || <DashboardPage />}
    </div>
  );
}

// ============ Main App ============
function MainApp() {
  const refreshMenus = useAppStore(s => s.refreshMenus);
  const loadAllConfigs = useConfigStore(s => s.loadAllConfigs);

  useEffect(() => {
    // On mount, re-fetch menus from API to sync with latest DB state.
    // This ensures sidebar reflects any menu visibility/structure changes
    // that were made since the last page load (zustand persist may have stale data).
    // The API also handles session recovery: if the userId is invalid (e.g. DB re-seeded),
    // it falls back to username lookup, and if both fail, clears the session (forces re-login).
    refreshMenus();
    // Load all configuration data from backend (departments, dict items, etc.)
    loadAllConfigs();
  }, [refreshMenus, loadAllConfigs]);

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900">
      <LoadingBar />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto scrollbar-thin">
          <ContentArea />
        </main>
        <footer className="h-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 mt-auto">
          医院感染管理系统 v1.0 © 2024
        </footer>
      </div>
    </div>
  );
}

// ============ Seed Initialization Component ============
function SeedInitializer({ onDone }: { onDone: () => void }) {
  const [seedError, setSeedError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const retryCountRef = useRef(0);

  const doSeed = useCallback(async () => {
    setRetrying(true);
    setSeedError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/seed', { method: 'POST', signal: controller.signal });
      if (!res.ok) {
        throw new Error(`初始化失败 (HTTP ${res.status})`);
      }
      const data = await res.json();
      console.log('[Seed] Result:', data);
      localStorage.setItem('hims-seed-done', 'true');
      retryCountRef.current = 0;
      onDone();
    } catch (e) {
      console.warn('[Seed] Error:', e);
      retryCountRef.current++;
      
      // If this is a network error (server might be starting up), auto-retry a few times
      const isNetworkError = e instanceof Error && (
        e.message.includes('abort') || 
        e.message.includes('Failed to fetch') || 
        e.message.includes('NetworkError') ||
        e.message.includes('Network request failed')
      );
      
      if (isNetworkError && retryCountRef.current < 3) {
        // Auto-retry with exponential backoff
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000);
        console.log(`[Seed] Auto-retry ${retryCountRef.current}/3 in ${delay}ms...`);
        setTimeout(() => {
          void doSeed();
        }, delay);
        return; // Don't show error yet
      }
      
      // Mark seed as attempted to prevent retry storms on every page load
      // But use 'error' value so we can distinguish from success
      localStorage.setItem('hims-seed-done', 'error');
      setSeedError(e instanceof Error ? e.message : '初始化失败');
    } finally {
      clearTimeout(timeoutId);
      setRetrying(false);
    }
  }, [onDone]);

  useEffect(() => {
    const seedDone = localStorage.getItem('hims-seed-done');
    if (seedDone === 'true') {
      // Seed already completed successfully
      onDone();
      return;
    }
    // Need to seed (either first time or previous error)
    doSeed();
  }, [doSeed, onDone]);

  if (seedError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center max-w-sm">
          <div className="mb-4 text-rose-400">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <div className="text-white text-lg font-medium mb-2">系统初始化失败</div>
          <div className="text-slate-400 text-sm mb-4">{seedError}</div>
          <div className="text-slate-500 text-xs mb-4">
            数据库可能未就绪，请稍后重试
          </div>
          <button
            onClick={doSeed}
            disabled={retrying}
            className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RotateCcw size={16} className={retrying ? 'animate-spin' : ''} />
            {retrying ? '正在重试...' : '重新初始化'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="mb-4 animate-bounce text-emerald-400">
          <Hospital size={48} className="mx-auto" />
        </div>
        <div className="text-white text-lg font-medium">系统初始化中...</div>
        <div className="text-slate-400 text-sm mt-2 flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin" />
          正在加载初始数据
        </div>
      </div>
    </div>
  );
}

// ============ Root Page ============
export default function Home() {
  const currentUser = useAppStore(s => s.currentUser);
  const [initializing, setInitializing] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [persistUser, setPersistUser] = useState<boolean | null>(null);

  // Wait for Zustand persist hydration to complete
  // This prevents flash of wrong state (SSR renders null user, client has persisted user)
  useEffect(() => {
    // Zustand persist hydrates asynchronously.
    // Use onFinishHydration callback to detect when hydration is truly complete.
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // If already hydrated (e.g. on subsequent renders), set immediately via microtask
    if (useAppStore.persist.hasHydrated()) {
      queueMicrotask(() => setHydrated(true));
    }

    // Fallback: if hydration doesn't fire within 1 second, proceed anyway
    const fallbackTimer = setTimeout(() => {
      setHydrated(true);
    }, 1000);

    return () => {
      clearTimeout(fallbackTimer);
      unsub();
    };
  }, []);

  // After hydration, check localStorage for persisted user to prevent flash of login page
  useEffect(() => {
    if (!hydrated) return;
    // Use microtask to avoid synchronous setState in effect
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem('hims-app-store');
        if (stored) {
          const parsed = JSON.parse(stored);
          setPersistUser(!!parsed?.state?.currentUser);
        } else {
          setPersistUser(false);
        }
      } catch {
        setPersistUser(false);
      }
    });
  }, [hydrated]);

  // Handle chunk load errors and unhandled promise rejections
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message?.includes('ChunkLoadError') || event.message?.includes('Loading chunk')) {
        console.warn('Chunk load error detected, reloading page...');
        // Clear potentially stale cache
        try {
          localStorage.removeItem('hims-seed-done');
        } catch { /* ignore */ }
        window.location.reload();
      }
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '');
      if (reason.includes('ChunkLoadError') || reason.includes('Loading chunk') || reason.includes('Failed to fetch')) {
        console.warn('Chunk load rejection detected, reloading page...');
        event.preventDefault();
        try {
          localStorage.removeItem('hims-seed-done');
        } catch { /* ignore */ }
        setTimeout(() => window.location.reload(), 1000);
      }
    };
    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const handleSeedDone = useCallback(() => {
    setInitializing(false);
  }, []);

  // Show loading screen during hydration or initialization
  if (!hydrated || initializing) {
    if (initializing) {
      return <SeedInitializer onDone={handleSeedDone} />;
    }
    // Hydrating but seed done — show a brief loading indicator
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <div className="text-slate-500 text-sm">正在恢复会话...</div>
        </div>
      </div>
    );
  }

  // If we're still checking persist state, show a brief loader
  // This prevents a flash of the login page for already-logged-in users
  if (persistUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <div className="text-slate-500 text-sm">正在加载...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <MainApp />;
}
