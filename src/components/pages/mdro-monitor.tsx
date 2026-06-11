'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { AnimatedCounter } from '@/components/shared/animated';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Bug, AlertTriangle, TrendingUp, TrendingDown, Minus, Shield, Activity,
  BarChart3, Clock, ChevronRight, BedDouble, Siren, Eye, FlaskConical,
} from 'lucide-react';

// ============ API Response Types ============
interface BacteriaItem {
  name: string;
  fullName: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  resistance: string;
  risk: string;
  lastDetected: string;
  color: string;
}

interface DeptItem {
  dept: string;
  count: number;
  crab: number;
  crkp: number;
  mrsa: number;
  vre: number;
  crpa: number;
  risk: string;
}

interface MonthlyItem {
  month: string;
  count: number;
}

interface AlertItem {
  id: string;
  bacteria: string;
  patientName: string;
  dept: string;
  warningLevel: string;
  warningType: string;
  description: string;
  status: string;
  createdAt: string;
}

interface MdroStatsData {
  overview: {
    total: number;
    thisMonth: number;
    alerts: number;
    departments: number;
  };
  byBacteria: BacteriaItem[];
  deptDistribution: DeptItem[];
  monthlyTrend: MonthlyItem[];
  recentAlerts: AlertItem[];
}

// ============ Color Schemes ============
const COLOR_MAP: Record<string, {
  bg: string; text: string; border: string; badge: string; card: string; bar: string; light: string;
}> = {
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    card: 'from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-800',
    bar: 'bg-rose-500',
    light: 'bg-rose-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    card: 'from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800',
    bar: 'bg-amber-500',
    light: 'bg-amber-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    card: 'from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800',
    bar: 'bg-purple-500',
    light: 'bg-purple-500',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    card: 'from-teal-50 to-white dark:from-teal-900/20 dark:to-slate-800',
    bar: 'bg-teal-500',
    light: 'bg-teal-500',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-700/30',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-600',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    card: 'from-slate-50 to-white dark:from-slate-700/30 dark:to-slate-800',
    bar: 'bg-slate-500',
    light: 'bg-slate-400',
  },
};

const RISK_COLORS: Record<string, string> = {
  '高风险': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  '中风险': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '低风险': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const LEVEL_DOT_COLORS: Record<string, string> = {
  '高': 'bg-red-500',
  '中': 'bg-amber-500',
  '低': 'bg-emerald-500',
};

// ============ Bacteria Detail Dialog ============
function BacteriaDetailDialog({
  open, onClose, bacteria, deptDistribution,
}: {
  open: boolean; onClose: () => void; bacteria: BacteriaItem | null; deptDistribution: DeptItem[];
}) {
  if (!bacteria) return null;
  const c = COLOR_MAP[bacteria.color] || COLOR_MAP.slate;
  const abbrKey = bacteria.name.toLowerCase() as 'crab' | 'crkp' | 'mrsa' | 'vre' | 'crpa';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug size={20} className={c.text} /> {bacteria.fullName} 监测详情
          </DialogTitle>
          <DialogDescription>查看耐药菌监测信息与趋势分析</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Header Card */}
          <div className={`p-4 rounded-lg bg-gradient-to-r ${c.card} border ${c.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{bacteria.fullName}</span>
                  <Badge className={c.badge}>{bacteria.name}</Badge>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{bacteria.resistance}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{bacteria.count}</div>
                <div className="text-xs text-slate-500">本月检出</div>
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '耐药类型', value: bacteria.resistance },
              { label: '风险等级', value: bacteria.risk, render: () => <span className={`px-2 py-0.5 rounded text-xs font-medium ${RISK_COLORS[bacteria.risk] || ''}`}>{bacteria.risk}</span> },
              { label: '趋势变化', value: `${bacteria.trendPercent > 0 ? '+' : ''}${bacteria.trendPercent}%`, render: () => (
                <span className={`flex items-center gap-1 text-sm font-medium ${bacteria.trend === 'up' ? 'text-red-600 dark:text-red-400' : bacteria.trend === 'down' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {bacteria.trend === 'up' ? <TrendingUp size={14} /> : bacteria.trend === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {bacteria.trendPercent > 0 ? '+' : ''}{bacteria.trendPercent}%
                </span>
              )},
              { label: '最近检出', value: bacteria.lastDetected },
            ].map((item, i) => (
              <div key={i} className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
                <div className="text-[10px] text-slate-400 mb-1">{item.label}</div>
                {item.render ? item.render() : <span className="text-sm text-slate-700 dark:text-slate-300">{item.value}</span>}
              </div>
            ))}
          </div>

          {/* Department distribution for this bacteria */}
          <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
            <div className="text-[10px] text-slate-400 mb-2">科室分布</div>
            <div className="space-y-1.5">
              {deptDistribution
                .filter(d => d[abbrKey] > 0)
                .sort((a, b) => b[abbrKey] - a[abbrKey])
                .map(d => {
                  const maxVal = Math.max(...deptDistribution.map(x => x[abbrKey]), 1);
                  const width = Math.max((d[abbrKey] / maxVal) * 100, 5);
                  return (
                    <div key={d.dept} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-14 text-right">{d.dept}</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div className={`h-full ${c.bar} rounded-full transition-all duration-500 flex items-center justify-end pr-1.5`} style={{ width: `${width}%` }}>
                          <span className="text-[9px] text-white font-medium">{d[abbrKey]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {deptDistribution.filter(d => d[abbrKey] > 0).length === 0 && (
                <div className="text-xs text-slate-400 text-center py-2">暂无科室检出记录</div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Main Page ============
export default function MdroMonitorPage() {
  const [data, setData] = useState<MdroStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBacteria, setSelectedBacteria] = useState<BacteriaItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetch('/api/mdro-stats')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.success) {
          setData(d.data);
        } else {
          setError(d.message || '获取数据失败');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBacteriaClick = (bacteria: BacteriaItem) => {
    setSelectedBacteria(bacteria);
    setShowDetail(true);
  };

  // ============ Loading State ============
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        {/* Bacteria cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
        {/* Overview skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        {/* Table + chart skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="text-center py-8">
      <p className="text-red-500 dark:text-red-400 mb-2">加载失败</p>
      <p className="text-sm text-slate-400">{error}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
        重新加载
      </Button>
    </div>
  );

  if (!data) return <div className="text-center text-slate-400 py-8">暂无数据</div>;

  const { byBacteria, overview, deptDistribution, monthlyTrend, recentAlerts } = data;
  const maxMonthly = Math.max(...monthlyTrend.map(m => m.count), 1);

  return (
    <div className="space-y-6">
      {/* ===== Header Section ===== */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Bug size={22} className="text-emerald-500" /> 多重耐药菌监测
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">MDRO实时监测与智能预警</p>
      </div>

      {/* ===== 5 MDRO Bacteria Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {byBacteria.map((b, i) => {
          const c = COLOR_MAP[b.color] || COLOR_MAP.slate;
          return (
            <button
              key={i}
              onClick={() => handleBacteriaClick(b)}
              className={`p-4 rounded-xl border ${c.border} bg-gradient-to-br ${c.card} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-left cursor-pointer group`}
            >
              {/* Top: Name + Abbr badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{b.fullName}</div>
                  <Badge className={`${c.badge} mt-1 text-[10px]`}>{b.name}</Badge>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors mt-1" />
              </div>

              {/* Resistance type */}
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">{b.resistance}</div>

              {/* Detection count */}
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                <AnimatedCounter target={b.count} />
              </div>
              <div className="text-[10px] text-slate-400">本月检出</div>

              {/* Trend + Risk */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1">
                  {b.trend === 'up' ? (
                    <TrendingUp size={12} className="text-red-500" />
                  ) : b.trend === 'down' ? (
                    <TrendingDown size={12} className="text-emerald-500" />
                  ) : (
                    <Minus size={12} className="text-slate-400" />
                  )}
                  <span className={`text-xs font-medium ${b.trend === 'up' ? 'text-red-600 dark:text-red-400' : b.trend === 'down' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {b.trendPercent > 0 ? '+' : ''}{b.trendPercent}%
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_COLORS[b.risk] || ''}`}>
                  {b.risk}
                </span>
              </div>

              {/* Last detection date */}
              <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                <Clock size={10} />
                <span>{b.lastDetected}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ===== Overview Statistics Row ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MDRO检出总数', value: overview.total, suffix: '株', icon: <Bug size={18} className="text-rose-500" />, color: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800' },
          { label: '本月新增', value: overview.thisMonth, suffix: '株', icon: <Activity size={18} className="text-amber-500" />, color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
          { label: '涉及科室', value: overview.departments, suffix: '个', icon: <BedDouble size={18} className="text-purple-500" />, color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' },
          { label: '活跃预警', value: overview.alerts, suffix: '条', icon: <Siren size={18} className="text-red-500" />, color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-xl border ${card.color} flex items-center gap-4 transition-all hover:shadow-md`}>
            <div className="flex-shrink-0">{card.icon}</div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                <AnimatedCounter target={card.value} suffix={card.suffix} />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Department Distribution Table + Monthly Trend Chart ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department MDRO Distribution Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <FlaskConical size={16} className="text-emerald-500" /> 科室MDRO分布
          </h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">科室</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">CRAB</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">CRKP</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">MRSA</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-teal-600 dark:text-teal-400 whitespace-nowrap">VRE</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">CRPA</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">合计</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">风险</th>
                </tr>
              </thead>
              <tbody>
                {deptDistribution.map((d, i) => (
                  <tr key={i} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{d.dept}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={d.crab > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-300 dark:text-slate-600'}>{d.crab}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={d.crkp > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-300 dark:text-slate-600'}>{d.crkp}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={d.mrsa > 0 ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-slate-300 dark:text-slate-600'}>{d.mrsa}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={d.vre > 0 ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-slate-300 dark:text-slate-600'}>{d.vre}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={d.crpa > 0 ? 'text-slate-600 dark:text-slate-400 font-medium' : 'text-slate-300 dark:text-slate-600'}>{d.crpa}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-slate-800 dark:text-slate-200">{d.count}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_COLORS[d.risk] || ''}`}>{d.risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly MDRO Trend Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-500" /> 月度MDRO检出趋势
          </h3>
          <div className="flex items-end gap-3 h-56">
            {monthlyTrend.map((m, i) => {
              const height = Math.max((m.count / maxMonthly) * 100, 3);
              const isLatest = i === monthlyTrend.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{m.count}</span>
                  <div className="w-full relative group">
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${isLatest ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-emerald-400'}`}
                      style={{ height: `${height * 1.8}px` }}
                    />
                    {isLatest && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">本月</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{m.month.slice(5)}月</span>
                </div>
              );
            })}
          </div>
          {/* Legend & summary */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" /> 本月
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" /> 历史月份
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              较上月
              <span className={`ml-1 font-medium ${monthlyTrend.length >= 2 && monthlyTrend[monthlyTrend.length - 1].count >= monthlyTrend[monthlyTrend.length - 2].count ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {monthlyTrend.length >= 2 && monthlyTrend[monthlyTrend.length - 2].count > 0 ? (
                  <>
                    {monthlyTrend[monthlyTrend.length - 1].count >= monthlyTrend[monthlyTrend.length - 2].count ? <TrendingUp size={11} className="inline" /> : <TrendingDown size={11} className="inline" />}
                    {' '}{Math.abs(((monthlyTrend[monthlyTrend.length - 1].count - monthlyTrend[monthlyTrend.length - 2].count) / monthlyTrend[monthlyTrend.length - 2].count) * 100).toFixed(1)}%
                  </>
                ) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Recent MDRO Alerts ===== */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" /> 最近MDRO预警
        </h3>
        {recentAlerts.length === 0 ? (
          <div className="text-center text-slate-400 py-6 text-sm">暂无MDRO预警记录</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recentAlerts.map((alert) => {
              const bacteriaInfo = byBacteria.find(b => b.fullName === alert.bacteria);
              const c = bacteriaInfo ? COLOR_MAP[bacteriaInfo.color] || COLOR_MAP.slate : COLOR_MAP.slate;
              const alertTime = new Date(alert.createdAt);
              const timeStr = `${alertTime.getFullYear()}-${String(alertTime.getMonth() + 1).padStart(2, '0')}-${String(alertTime.getDate()).padStart(2, '0')} ${String(alertTime.getHours()).padStart(2, '0')}:${String(alertTime.getMinutes()).padStart(2, '0')}`;
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border border-slate-100 dark:border-slate-700 border-l-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30`}
                  style={{ borderLeftColor: bacteriaInfo ? undefined : undefined }}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${c.light}`} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${LEVEL_DOT_COLORS[alert.warningLevel] || 'bg-slate-400'}`} />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{alert.warningType}</span>
                      <Badge className={`${c.badge} text-[10px]`}>{bacteriaInfo?.name || alert.bacteria}</Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{alert.bacteria}</span>
                    </div>
                    <StatusBadge status={alert.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><BedDouble size={10} /> {alert.dept}</span>
                    <span>患者: {alert.patientName}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {timeStr}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${alert.warningLevel === '高' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {alert.warningLevel}级
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* View all alerts link */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
          <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 gap-1">
            <Eye size={12} /> 查看全部MDRO预警
          </Button>
        </div>
      </div>

      {/* ===== Bacteria Detail Dialog ===== */}
      {showDetail && (
        <BacteriaDetailDialog
          open={showDetail}
          bacteria={selectedBacteria}
          deptDistribution={deptDistribution}
          onClose={() => { setShowDetail(false); setSelectedBacteria(null); }}
        />
      )}
    </div>
  );
}
