'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter, CircularProgress } from '@/components/shared/animated';
import { Activity, AlertTriangle, Bug, Pill, Hand, ShieldCheck, HardHat, ShieldAlert, TrendingDown, TrendingUp, Zap, CheckCircle2, AlertCircle, BarChart3, PieChart, Microscope, Droplets, FileSpreadsheet, Hospital, Clock, Plus, Bell, Sun, Moon, RefreshCw, Pause, Play } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';

// ============ Real-time Clock Component ============
function DashboardClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  const icon = hour < 6 ? <Moon size={18} /> : hour < 12 ? <Sun size={18} /> : hour < 18 ? <Sun size={18} /> : <Moon size={18} />;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        {icon}
        <span className="text-lg font-semibold">{greeting}</span>
      </div>
      <div className="h-5 w-px bg-slate-300 dark:bg-slate-600" />
      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <Clock size={14} />
        <span>{time.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
        <span className="text-slate-400 dark:text-slate-500">|</span>
        <span className="font-mono tabular-nums">{time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  );
}

// ============ Mini Sparkline ============
function MiniSparkline({ data, color = '#10b981', width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="opacity-60">
      <polygon points={areaPoints} fill={color} fillOpacity={0.1} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============ Recent Warnings Mini-List ============
function RecentWarnings({ refreshTrigger }: { refreshTrigger: number }) {
  const [warnings, setWarnings] = useState<Array<{ id: string; patientName: string; dept: string; warningLevel: string; description: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/warnings?pageSize=5')
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.success && d.data?.items) {
          setWarnings(d.data.items.slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const levelColors: Record<string, string> = {
    '高': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '中': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    '低': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Bell size={18} className="text-rose-500" /> 最近预警
        <button
          onClick={() => useAppStore.getState().setActiveMenu('infection-warning')}
          className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
        >
          查看全部 →
        </button>
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : warnings.length === 0 ? (
        <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">暂无预警记录</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
          {warnings.map((w, i) => (
            <div key={w.id || i}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
              onClick={() => useAppStore.getState().setActiveMenu('infection-warning')}
            >
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${levelColors[w.warningLevel] || levelColors['低']}`}>
                {w.warningLevel}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {w.patientName} - {w.dept}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{w.description}</div>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {w.createdAt?.slice(5, 10) || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Dashboard Page ============
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const res = await fetch('/api/dashboard');
      const d = await res.json();
      if (d.success) {
        setStats(d.data);
        setLastRefreshTime(new Date());
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        void fetchStats(true);
        setRefreshTrigger(prev => prev + 1);
      }, 60000);
    } else {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    }
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh, fetchStats]);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );

  if (!stats) return <div className="text-center text-slate-400 py-8">暂无数据</div>;

  const statCards = [
    { label: '累计感染病例', value: stats.totalInfections, icon: <Activity size={22} />, gradient: 'from-rose-500 to-pink-600', bgLight: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', darkBg: 'dark:bg-rose-900/20', darkBorder: 'dark:border-rose-800', darkText: 'dark:text-rose-400', trend: `本月+${stats.monthInfections}`, trendIcon: <TrendingUp size={12} />, sparkData: stats.infectionTrend?.map(t => t.count) || [] },
    { label: '待处理预警', value: stats.pendingWarnings, icon: <AlertTriangle size={22} />, gradient: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', darkBg: 'dark:bg-amber-900/20', darkBorder: 'dark:border-amber-800', darkText: 'dark:text-amber-400', trend: '需及时处理', trendIcon: <Zap size={12} />, sparkData: [] },
    { label: '多重耐药菌', value: stats.mdroCount, icon: <Bug size={22} />, gradient: 'from-purple-500 to-violet-600', bgLight: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/20', darkBorder: 'dark:border-purple-800', darkText: 'dark:text-purple-400', trend: '重点关注', trendIcon: <AlertCircle size={12} />, sparkData: [] },
    { label: '抗菌药物使用率', value: stats.antibioticUsageRate, suffix: '%', icon: <Pill size={22} />, gradient: 'from-teal-500 to-cyan-600', bgLight: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', darkBg: 'dark:bg-teal-900/20', darkBorder: 'dark:border-teal-800', darkText: 'dark:text-teal-400', trend: '持续监测', trendIcon: <Activity size={12} />, sparkData: [35, 42, 38, 45, 40, stats.antibioticUsageRate] },
    { label: '手卫生依从率', value: stats.handHygieneRate, suffix: '%', icon: <Hand size={22} />, gradient: 'from-emerald-500 to-green-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/20', darkBorder: 'dark:border-emerald-800', darkText: 'dark:text-emerald-400', trend: '稳步提升', trendIcon: <TrendingUp size={12} />, sparkData: [72, 78, 82, 85, 88, stats.handHygieneRate] },
    { label: '环境卫生合格率', value: stats.envHygieneRate, suffix: '%', icon: <ShieldCheck size={22} />, gradient: 'from-cyan-500 to-sky-600', bgLight: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', darkBg: 'dark:bg-cyan-900/20', darkBorder: 'dark:border-cyan-800', darkText: 'dark:text-cyan-400', trend: '达标', trendIcon: <CheckCircle2 size={12} />, sparkData: [90, 92, 88, 93, 91, stats.envHygieneRate] },
    { label: '职业暴露事件', value: stats.exposureCount, icon: <HardHat size={22} />, gradient: 'from-orange-500 to-red-500', bgLight: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/20', darkBorder: 'dark:border-orange-800', darkText: 'dark:text-orange-400', trend: '本年度累计', trendIcon: <ShieldAlert size={12} />, sparkData: [] },
    { label: '本月新增感染', value: stats.monthInfections, icon: <TrendingDown size={22} />, gradient: 'from-red-500 to-rose-600', bgLight: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', darkBg: 'dark:bg-red-900/20', darkBorder: 'dark:border-red-800', darkText: 'dark:text-red-400', trend: `累计${stats.monthInfections}例`, trendIcon: <TrendingDown size={12} />, sparkData: [] },
  ];

  // Circular progress data
  const circularData = [
    { label: '手卫生依从率', value: stats.handHygieneRate, color: '#10b981' },
    { label: '抗菌药物使用率', value: stats.antibioticUsageRate, color: '#f59e0b' },
    { label: '环境合格率', value: stats.envHygieneRate, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome + Clock Header with Auto-Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">感染监控概览</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">实时监控医院感染相关指标</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardClock />
          {/* Auto-refresh controls */}
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`gap-1.5 h-8 text-xs ${autoRefresh ? 'bg-emerald-600 hover:bg-emerald-500' : ''}`}
            >
              {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
              {autoRefresh ? '暂停' : '自动刷新'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { void fetchStats(true); setRefreshTrigger(prev => prev + 1); }}
              disabled={isRefreshing}
              className="gap-1.5 h-8 text-xs"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              刷新
            </Button>
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-1.5">
              {autoRefresh && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
              {lastRefreshTime && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  更新于 {lastRefreshTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards with gradient backgrounds, shadows and sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i}
            className={`relative overflow-hidden p-4 rounded-xl border ${card.bgLight} ${card.border} ${card.darkBg} ${card.darkBorder} transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.03] group cursor-default`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Gradient accent background overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.04] group-hover:opacity-[0.10] transition-opacity duration-300`} />
            {/* Gradient accent bar at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-80 group-hover:opacity-100 transition-opacity duration-300`} />
            {/* Subtle corner decoration */}
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-tl ${card.gradient} opacity-[0.06] rounded-full blur-xl group-hover:opacity-[0.12] transition-opacity duration-300`} />
            <div className="relative flex items-center justify-between mb-2">
              <div className={`opacity-80 group-hover:opacity-100 transition-opacity duration-200 ${card.text} ${card.darkText}`}>{card.icon}</div>
              <span className={`text-[10px] opacity-60 flex items-center gap-0.5 ${card.text} ${card.darkText}`}>{card.trendIcon}{card.trend}</span>
            </div>
            <div className={`relative text-2xl font-bold ${card.text} ${card.darkText}`}>
              <AnimatedCounter target={card.value} suffix={card.suffix || ''} />
            </div>
            <div className={`relative text-xs opacity-70 mt-1 ${card.text} ${card.darkText}`}>{card.label}</div>
            {/* Mini sparkline */}
            {card.sparkData.length >= 2 && (
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <MiniSparkline data={card.sparkData} color={card.gradient.includes('rose') ? '#f43f5e' : card.gradient.includes('amber') ? '#f59e0b' : card.gradient.includes('purple') ? '#a855f7' : card.gradient.includes('teal') ? '#14b8a6' : card.gradient.includes('emerald') ? '#10b981' : card.gradient.includes('cyan') ? '#06b6d4' : card.gradient.includes('orange') ? '#f97316' : '#ef4444'} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Circular progress indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {circularData.map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="relative flex-shrink-0">
              <CircularProgress value={item.value} size={64} strokeWidth={6} color={item.color} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-slate-200">{item.value}%</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.label}</div>
              <div className={`text-xs mt-0.5 font-medium ${item.value >= 80 ? 'text-emerald-500' : item.value >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{item.value >= 80 ? '✓ 达标' : item.value >= 60 ? '⚠ 待改善' : '✗ 需关注'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infection Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-500" /> 感染趋势（近12月）
          </h3>
          <div className="h-64 flex items-end gap-1.5 sm:gap-2">
            {stats.infectionTrend.map((item, i) => {
              const maxCount = Math.max(...stats.infectionTrend.map(t => t.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">{item.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300 min-h-[4px] group-hover:shadow-lg group-hover:shadow-emerald-500/20 group-hover:brightness-110"
                    style={{ height: `${Math.max(height, 4)}%`, animationDelay: `${i * 50}ms` }}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 -rotate-45 origin-center whitespace-nowrap">{item.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Site Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-emerald-500" /> 感染部位分布
          </h3>
          <div className="space-y-3">
            {stats.siteDistribution.map((item, i) => {
              const maxCount = Math.max(...stats.siteDistribution.map(s => s.count), 1);
              const pct = (item.count / maxCount) * 100;
              const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-orange-500'];
              const hoverColors = ['hover:bg-emerald-400', 'hover:bg-teal-400', 'hover:bg-cyan-400', 'hover:bg-rose-400', 'hover:bg-amber-400', 'hover:bg-purple-400', 'hover:bg-orange-400'];
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.site}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.count}例</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} ${hoverColors[i % hoverColors.length]} rounded-full transition-all duration-700 group-hover:shadow-sm`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dept Infection Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> 科室感染率
          </h3>
          <div className="space-y-4">
            {stats.deptInfectionRate.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-slate-700 dark:text-slate-300 w-16 text-right">{item.dept}</span>
                <div className="flex-1 h-8 bg-slate-50 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(item.rate * 5, 100)}%` }}
                  >
                    <span className="text-xs text-white font-bold">{item.rate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-emerald-500" /> 快捷操作
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '新增感染病例', icon: <Microscope size={20} />, menu: 'infection-case' },
              { label: '处理预警', icon: <AlertTriangle size={20} />, menu: 'infection-warning' },
              { label: '环境监测录入', icon: <Droplets size={20} />, menu: 'env-hygiene' },
              { label: '职业暴露上报', icon: <ShieldAlert size={20} />, menu: 'occupational-exposure' },
              { label: '抗菌药物管理', icon: <Pill size={20} />, menu: 'antibiotic' },
              { label: '感染报告', icon: <FileSpreadsheet size={20} />, menu: 'data-report' },
            ].map((action, i) => (
              <button key={i}
                onClick={() => useAppStore.getState().setActiveMenu(action.menu)}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 text-left group">
                <div className="text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform duration-200">{action.icon}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Warnings Section */}
      <RecentWarnings refreshTrigger={refreshTrigger} />
    </div>
  );
}
