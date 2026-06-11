'use client';

import { useState, useEffect, ComponentType, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { useConfigStore } from '@/store/config-store';
import { Hospital, RefreshCw, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    // Intercept fetch to show loading bar for API calls
    const originalFetch = window.fetch;
    let activeRequests = 0;

    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      // Only show loading bar for API calls (not static assets)
      if (url.startsWith('/api/')) {
        activeRequests++;
        if (!loading) {
          setLoading(true);
          setComplete(false);
        }
      }

      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        if (url.startsWith('/api/')) {
          activeRequests--;
          if (activeRequests <= 0) {
            activeRequests = 0;
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
  }, [loading]);

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

// ============ Root Page ============
export default function Home() {
  const currentUser = useAppStore(s => s.currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Handle chunk load errors by reloading the page
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message?.includes('ChunkLoadError') || event.message?.includes('Loading chunk')) {
        console.warn('Chunk load error detected, reloading page...');
        window.location.reload();
      }
    };
    window.addEventListener('error', handleChunkError);
    return () => window.removeEventListener('error', handleChunkError);
  }, []);

  useEffect(() => {
    // Only seed once - check localStorage flag first
    const seedDone = localStorage.getItem('hims-seed-done');
    if (seedDone === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitializing(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch('/api/seed', { method: 'POST', signal: controller.signal })
      .then(r => {
        if (!r.ok) {
          throw new Error(`Seed failed with status ${r.status}`);
        }
        return r.json();
      })
      .then(d => {
        console.log('Seed result:', d);
        localStorage.setItem('hims-seed-done', 'true');
      })
      .catch(e => {
        console.error('Seed error:', e);
        // Don't set hims-seed-done on failure so it can be retried
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setInitializing(false);
      });
  }, []);

  if (initializing) {
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

  if (!currentUser) {
    return <LoginPage />;
  }

  return <MainApp />;
}
