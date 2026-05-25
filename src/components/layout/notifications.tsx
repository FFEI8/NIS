'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Info, Bell, X } from 'lucide-react';

interface Notification {
  id: string; type: 'warning' | 'approval' | 'system'; title: string; message: string; time: string; read: boolean;
}

export function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifications: Notification[] = useMemo(() => [
    { id: '1', type: 'warning', title: '暴发预警', message: 'ICU病房检测到疑似感染暴发趋势，请及时处理', time: '5分钟前', read: false },
    { id: '2', type: 'approval', title: '待审核病例', message: '新增3例感染病例待审核确认', time: '15分钟前', read: false },
    { id: '3', type: 'warning', title: '环境监测异常', message: '手术室空气菌落数超标，需重新监测', time: '1小时前', read: false },
    { id: '4', type: 'system', title: '系统更新', message: '系统已升级至v1.1版本，新增数据导出功能', time: '2小时前', read: true },
    { id: '5', type: 'approval', title: '报告审批', message: '12月份感染月报待审批', time: '3小时前', read: true },
  ], []);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'approval': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'system': return <Info size={16} className="text-sky-500" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-14 right-24 w-96 max-h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell size={18} /> 通知中心
            <Badge variant="secondary" className="text-xs">{notifications.filter(n => !n.read).length} 未读</Badge>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map(n => (
            <div key={n.id} className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!n.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</span>
                    {!n.read && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1">{n.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 text-center border-t border-slate-200 dark:border-slate-700">
          <button className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 font-medium">查看全部通知</button>
        </div>
      </div>
    </div>
  );
}
