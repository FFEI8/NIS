'use client';

import { useState, useEffect } from 'react';
import type { DashboardStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter, CircularProgress } from '@/components/shared/animated';
import { Activity, AlertTriangle, Bug, Pill, Hand, ShieldCheck, HardHat, ShieldAlert, TrendingDown, TrendingUp, Zap, CheckCircle2, AlertCircle, BarChart3, PieChart, Microscope, Droplets, FileSpreadsheet, Hospital } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
    }).finally(() => setLoading(false));
  }, []);

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
    { label: '累计感染病例', value: stats.totalInfections, icon: <Activity size={22} />, color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800', trend: `本月+${stats.monthInfections}`, trendIcon: <TrendingUp size={12} /> },
    { label: '待处理预警', value: stats.pendingWarnings, icon: <AlertTriangle size={22} />, color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', trend: '需及时处理', trendIcon: <Zap size={12} /> },
    { label: '多重耐药菌', value: stats.mdroCount, icon: <Bug size={22} />, color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800', trend: '重点关注', trendIcon: <AlertCircle size={12} /> },
    { label: '抗菌药物使用率', value: stats.antibioticUsageRate, suffix: '%', icon: <Pill size={22} />, color: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800', trend: '持续监测', trendIcon: <Activity size={12} /> },
    { label: '手卫生依从率', value: stats.handHygieneRate, suffix: '%', icon: <Hand size={22} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', trend: '稳步提升', trendIcon: <TrendingUp size={12} /> },
    { label: '环境卫生合格率', value: stats.envHygieneRate, suffix: '%', icon: <ShieldCheck size={22} />, color: 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800', trend: '达标', trendIcon: <CheckCircle2 size={12} /> },
    { label: '职业暴露事件', value: stats.exposureCount, icon: <HardHat size={22} />, color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800', trend: '本年度累计', trendIcon: <ShieldAlert size={12} /> },
    { label: '本月新增感染', value: stats.monthInfections, icon: <TrendingDown size={22} />, color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', trend: `累计${stats.monthInfections}例`, trendIcon: <TrendingDown size={12} /> },
  ];

  // Circular progress data
  const circularData = [
    { label: '手卫生依从率', value: stats.handHygieneRate, color: '#10b981' },
    { label: '抗菌药物使用率', value: stats.antibioticUsageRate, color: '#f59e0b' },
    { label: '环境合格率', value: stats.envHygieneRate, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">感染监控概览</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">实时监控医院感染相关指标</p>
        </div>
      </div>

      {/* Stat cards with animated counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`p-4 rounded-xl border ${card.color} transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-2">
              <div className="opacity-80">{card.icon}</div>
              <span className="text-[10px] opacity-60 flex items-center gap-0.5">{card.trendIcon}{card.trend}</span>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter target={card.value} suffix={card.suffix || ''} />
            </div>
            <div className="text-xs opacity-70 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Circular progress indicators */}
      <div className="grid grid-cols-3 gap-4">
        {circularData.map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="relative">
              <CircularProgress value={item.value} size={56} strokeWidth={5} color={item.color} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-slate-200">{item.value}%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.value >= 80 ? '达标' : item.value >= 60 ? '待改善' : '需关注'}</div>
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
          <div className="h-64 flex items-end gap-2">
            {stats.infectionTrend.map((item, i) => {
              const maxCount = Math.max(...stats.infectionTrend.map(t => t.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300 min-h-[4px] group-hover:opacity-80"
                    style={{ height: `${Math.max(height, 4)}%` }}
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
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.site}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.count}例</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
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
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 text-left group">
                <div className="text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform">{action.icon}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
