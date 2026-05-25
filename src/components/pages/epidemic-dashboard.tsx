'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { AnimatedCounter, CircularProgress } from '@/components/shared/animated';
import { Biohazard, Siren, FileWarning, ClipboardCheck, AlertTriangle, UsersRound, Gauge, Hospital, BarChart4, ActivitySquare, LineChart } from 'lucide-react';

export default function EpidemicDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/infectious-disease-stats').then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );

  if (!stats) return <div className="text-center text-slate-400 py-8">暂无数据</div>;

  const overview = stats.overview || {};
  const casesByCategory = stats.casesByCategory || [];
  const casesByDisease = stats.casesByDisease || [];
  const casesByDept = stats.casesByDept || [];
  const monthlyTrend = stats.monthlyTrend || [];
  const alertsByLevel = stats.alertsByLevel || [];
  const recentAlerts = stats.recentAlerts || [];

  const catMap: Record<string, number> = {};
  casesByCategory.forEach((c: any) => { catMap[c.diseaseCategory] = c._count.diseaseCategory; });

  const statCards = [
    { label: '总病例数', value: overview.totalCases || 0, icon: <Biohazard size={22} />, color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' },
    { label: '甲类病例', value: catMap['甲类'] || 0, icon: <Siren size={22} />, color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
    { label: '乙类病例', value: catMap['乙类'] || 0, icon: <FileWarning size={22} />, color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
    { label: '丙类病例', value: catMap['丙类'] || 0, icon: <ClipboardCheck size={22} />, color: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800' },
    { label: '待处理预警', value: overview.pendingAlerts || 0, icon: <AlertTriangle size={22} />, color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' },
    { label: '接触者追踪', value: overview.totalContacts || 0, icon: <UsersRound size={22} />, color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' },
  ];

  const maxMonthly = Math.max(...monthlyTrend.map((m: any) => m._count.id || 0), 1);
  const maxDisease = Math.max(...casesByDisease.slice(0, 8).map((d: any) => d._count.diseaseName || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Gauge size={22} className="text-emerald-500" /> 疫情看板
        </h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">传染病疫情数据统计与可视化分析</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`p-4 rounded-xl border ${card.color} transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-2">
              {card.icon}
            </div>
            <div className="text-2xl font-bold"><AnimatedCounter target={card.value} /></div>
            <div className="text-xs mt-1 opacity-80">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BarChart4 size={16} className="text-emerald-500" /> 月度病例趋势
          </h3>
          <div className="flex items-end gap-1 h-48">
            {monthlyTrend.slice(0, 12).map((m: any, i: number) => {
              const height = Math.max((m._count.id / maxMonthly) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{m._count.id}</span>
                  <div className="w-full bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-400" style={{ height: `${height}%` }} />
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">{String(m._month).slice(-2)}</span>
                </div>
              );
            })}
          </div>
          {monthlyTrend.length === 0 && <div className="text-center text-slate-400 py-8">暂无数据</div>}
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <ActivitySquare size={16} className="text-emerald-500" /> 病种分布 TOP8
          </h3>
          <div className="space-y-2.5">
            {casesByDisease.slice(0, 8).map((d: any, i: number) => {
              const width = Math.max((d._count.diseaseName / maxDisease) * 100, 3);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 w-20 truncate text-right">{d.diseaseName}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700 flex items-center justify-end pr-1.5" style={{ width: `${width}%` }}>
                      <span className="text-[10px] text-white font-medium">{d._count.diseaseName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {casesByDisease.length === 0 && <div className="text-center text-slate-400 py-4">暂无数据</div>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <LineChart size={16} className="text-emerald-500" /> 分类统计
          </h3>
          <div className="space-y-3">
            {[
              { cat: '甲类', count: catMap['甲类'] || 0, color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
              { cat: '乙类', count: catMap['乙类'] || 0, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
              { cat: '丙类', count: catMap['丙类'] || 0, color: 'bg-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
              { cat: '其他', count: catMap['其他'] || 0, color: 'bg-slate-400', bg: 'bg-slate-50 dark:bg-slate-700/30', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-600' },
            ].map(item => {
              const total = Object.values(catMap).reduce((s: number, v: number) => s + v, 0) || 1;
              return (
                <div key={item.cat} className={`p-3 rounded-lg border ${item.border} ${item.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className={`text-sm font-medium ${item.text}`}>{item.cat}传染病</span>
                    </div>
                    <span className={`text-xl font-bold ${item.text}`}><AnimatedCounter target={item.count} /></span>
                  </div>
                  <div className="mt-2 bg-white/50 dark:bg-slate-900/30 rounded-full h-2">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${(item.count / total) * 100}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-slate-400 mt-0.5">{((item.count / total) * 100).toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Hospital size={16} className="text-emerald-500" /> 科室分布
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 text-slate-500 dark:text-slate-400 text-xs font-medium">科室</th>
                  <th className="text-right py-2 text-slate-500 dark:text-slate-400 text-xs font-medium">病例数</th>
                </tr>
              </thead>
              <tbody>
                {casesByDept.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-2 text-slate-700 dark:text-slate-300">{d.dept}</td>
                    <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-200">{d._count.dept}</td>
                  </tr>
                ))}
                {casesByDept.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-slate-400">暂无数据</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Siren size={16} className="text-emerald-500" /> 预警等级分布
          </h3>
          <div className="flex items-center justify-center gap-6 py-4">
            {alertsByLevel.length > 0 ? alertsByLevel.map((a: any) => {
              const colors: Record<string, string> = {
                '红色': '#ef4444', '橙色': '#f97316', '黄色': '#eab308', '蓝色': '#3b82f6',
              };
              return (
                <div key={a.alertLevel} className="text-center">
                  <CircularProgress value={(a._count.alertLevel / (overview.pendingAlerts || 1)) * 100} color={colors[a.alertLevel] || '#94a3b8'} size={56} />
                  <div className="mt-2 text-xs font-medium" style={{ color: colors[a.alertLevel] || '#94a3b8' }}>{a.alertLevel}</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{a._count.alertLevel}</div>
                </div>
              );
            }) : <div className="text-center text-slate-400 py-8">暂无预警数据</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-emerald-500" /> 最近预警
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {(recentAlerts.length > 0 ? recentAlerts : []).map((a: any, i: number) => {
              const levelColors: Record<string, string> = {
                '红色': 'border-l-red-500', '橙色': 'border-l-orange-500', '黄色': 'border-l-yellow-500', '蓝色': 'border-l-blue-500',
              };
              return (
                <div key={i} className={`p-2.5 rounded border border-slate-100 dark:border-slate-700 border-l-4 ${levelColors[a.alertLevel] || 'border-l-slate-400'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.alertType}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                  <span className="text-[10px] text-slate-400 mt-1">{a.createdAt?.slice(0, 10)}</span>
                </div>
              );
            })}
            {recentAlerts.length === 0 && <div className="text-center text-slate-400 py-8">暂无预警</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
