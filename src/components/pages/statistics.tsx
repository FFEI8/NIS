'use client';

import { BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <BarChart3 size={22} className="text-emerald-500" /> 统计分析中心
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">各科室感染率趋势</h3>
          <div className="h-48 flex items-end gap-3">
            {['ICU', '外科', '内科', '儿科', '妇产'].map((dept, i) => {
              const rates = [4.2, 2.8, 1.5, 1.1, 0.8];
              return (
                <div key={dept} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{rates[i]}%</span>
                  <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md" style={{ height: `${rates[i] * 30}px` }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{dept}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">抗菌药物使用趋势</h3>
          <div className="h-48 flex items-end gap-2">
            {['7月', '8月', '9月', '10月', '11月', '12月'].map((m, i) => {
              const rate = 35 + Math.random() * 10;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{rate.toFixed(1)}%</span>
                  <div className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-md" style={{ height: `${rate * 2.5}px` }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
