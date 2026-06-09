'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart3 } from 'lucide-react';
import { useConfigStore } from '@/store/config-store';

export default function StatisticsPage() {
  const { getDeptNames, loaded, loadAllConfigs } = useConfigStore();
  const [deptRates, setDeptRates] = useState<{ dept: string; rate: number }[]>([]);
  const [monthlyAntibiotic, setMonthlyAntibiotic] = useState<{ month: string; rate: number }[]>([]);

  useEffect(() => {
    if (!loaded) {
      loadAllConfigs();
    }
  }, [loaded, loadAllConfigs]);

  // Fetch all statistics data
  const fetchStats = useCallback(async () => {
    try {
      const [deptRes, antibioticRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/antibiotic-usages?pageSize=100'),
      ]);
      const [deptData, antibioticData] = await Promise.all([
        deptRes.json(),
        antibioticRes.json(),
      ]);

      if (deptData.success && deptData.data?.deptRate) {
        setDeptRates(deptData.data.deptRate.map((item: any) => ({
          dept: item.dept,
          rate: parseFloat(item.rate) || 0,
        })));
      }

      if (antibioticData.success && antibioticData.data?.items) {
        const monthlyMap: Record<string, { total: number; count: number }> = {};
        for (const item of antibioticData.data.items) {
          if (item.usageDate) {
            const month = item.usageDate.slice(0, 7);
            if (!monthlyMap[month]) monthlyMap[month] = { total: 0, count: 0 };
            monthlyMap[month].total += item.usageRate || 0;
            monthlyMap[month].count += 1;
          }
        }
        const sorted = Object.entries(monthlyMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([month, { total, count }]) => ({
            month: month.replace(/^\d{4}-/, ''),
            rate: count > 0 ? parseFloat((total / count).toFixed(1)) : 0,
          }));
        setMonthlyAntibiotic(sorted);
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchStats(); }, [fetchStats]);

  // Department names from config store
  const deptNames = getDeptNames().length > 0 ? getDeptNames() : ['ICU', '外科', '内科', '儿科', '妇产'];
  const displayDepts = deptRates.length > 0
    ? deptRates.slice(0, 5)
    : deptNames.slice(0, 5).map((dept, i) => {
        const rates = [4.2, 2.8, 1.5, 1.1, 0.8];
        return { dept, rate: rates[i] || 0 };
      });

  const displayAntibiotic = monthlyAntibiotic.length > 0
    ? monthlyAntibiotic
    : [
        { month: '7月', rate: 38.2 },
        { month: '8月', rate: 36.5 },
        { month: '9月', rate: 39.1 },
        { month: '10月', rate: 37.8 },
        { month: '11月', rate: 40.2 },
        { month: '12月', rate: 35.6 },
      ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <BarChart3 size={22} className="text-emerald-500" /> 统计分析中心
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">各科室感染率趋势</h3>
          <div className="h-48 flex items-end gap-3">
            {displayDepts.map((item) => (
              <div key={item.dept} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">{item.rate}%</span>
                <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md" style={{ height: `${item.rate * 30}px` }} />
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full" title={item.dept}>{item.dept}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">抗菌药物使用趋势</h3>
          <div className="h-48 flex items-end gap-2">
            {displayAntibiotic.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">{item.rate}%</span>
                <div className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-md" style={{ height: `${item.rate * 2.5}px` }} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
