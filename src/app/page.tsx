'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Hospital, RefreshCw } from 'lucide-react';
import LoginPage from '@/components/layout/login-page';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

// Dynamic imports for page components to reduce initial compilation payload
import dynamic from 'next/dynamic';

const DashboardPage = dynamic(() => import('@/components/pages/dashboard'));
const InfectionCasesPage = dynamic(() => import('@/components/pages/infection-cases'));
const WarningsPage = dynamic(() => import('@/components/pages/warnings'));
const TargetMonitoringPage = dynamic(() => import('@/components/pages/target-monitoring'));
const EnvironmentalMonitorPage = dynamic(() => import('@/components/pages/environmental-monitor'));
const SterilizationPage = dynamic(() => import('@/components/pages/sterilization'));
const OccupationalExposurePage = dynamic(() => import('@/components/pages/occupational-exposure'));
const HandHygienePage = dynamic(() => import('@/components/pages/hand-hygiene'));
const AntibioticUsagePage = dynamic(() => import('@/components/pages/antibiotic-usage'));
const InfectionReportsPage = dynamic(() => import('@/components/pages/infection-reports'));
const StatisticsPage = dynamic(() => import('@/components/pages/statistics'));
const UserManagementPage = dynamic(() => import('@/components/pages/user-management'));
const RoleManagementPage = dynamic(() => import('@/components/pages/role-management'));
const MenuManagementPage = dynamic(() => import('@/components/pages/menu-management'));
const PermissionManagementPage = dynamic(() => import('@/components/pages/permission-management'));
const InfectiousDiseaseCasePage = dynamic(() => import('@/components/pages/infectious-disease-case'));
const ContactTracingPage = dynamic(() => import('@/components/pages/contact-tracing'));
const SymptomSurveillancePage = dynamic(() => import('@/components/pages/symptom-surveillance'));
const EpidemicDashboardPage = dynamic(() => import('@/components/pages/epidemic-dashboard'));
const DiseaseAlertPage = dynamic(() => import('@/components/pages/disease-alert'));

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
  };

  return (
    <div className="p-4 md:p-6">
      {pages[activeMenu] || <DashboardPage />}
    </div>
  );
}

// ============ Main App ============
function MainApp() {
  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
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
      .then(r => r.json())
      .then(d => {
        console.log('Seed result:', d);
        localStorage.setItem('hims-seed-done', 'true');
      })
      .catch(e => {
        console.log('Seed already done or error:', e);
        // Mark as done even on error to avoid infinite retries
        localStorage.setItem('hims-seed-done', 'true');
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
