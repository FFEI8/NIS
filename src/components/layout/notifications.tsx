'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Info, Bell, X, Loader2, ExternalLink } from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'approval' | 'system' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetMenu?: string; // menu code to navigate to when clicked
}

// Map notification id prefixes to target menu codes
const NOTIFICATION_MENU_MAP: Record<string, string> = {
  'warning-': 'infection-warning',     // 预警记录
  'review-': 'env-hygiene',            // 环境监测
  'case-': 'infection-case',           // 感染病例
  'disease-alert-': 'id-disease-alert', // 传染病预警
  'id-case-': 'id-case-report',        // 传染病病例上报
  'system-': 'dashboard',              // 首页
};

// Map notification type to target menu as fallback
const NOTIFICATION_TYPE_MENU_MAP: Record<string, string> = {
  'warning': 'infection-warning',
  'approval': 'env-hygiene',
  'system': 'dashboard',
  'info': 'infection-case',
};

function getTargetMenu(notification: Notification): string {
  // First check if the notification has an explicit target
  if (notification.targetMenu) return notification.targetMenu;
  // Then check id prefix mapping
  for (const [prefix, menu] of Object.entries(NOTIFICATION_MENU_MAP)) {
    if (notification.id.startsWith(prefix)) return menu;
  }
  // Fallback to type-based mapping
  return NOTIFICATION_TYPE_MENU_MAP[notification.type] || 'dashboard';
}

function formatTime(time: string | Date): string {
  const date = typeof time === 'string' ? new Date(time) : time;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

export function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setActiveMenu = useAppStore(s => s.setActiveMenu);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('获取通知失败');
      const data = await res.json();
      if (data.success && data.data) {
        const apiNotifications: Notification[] = (data.data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type || 'info',
          title: n.title,
          message: n.description || n.message || '',
          time: formatTime(n.time),
          read: n.read ?? false,
          targetMenu: n.targetMenu,
        }));
        setNotifications(apiNotifications);
      }
    } catch (err: any) {
      setError(err.message);
      // Fallback to static notifications if API fails
      setNotifications([
        { id: 'warning-fallback-1', type: 'warning', title: '暴发预警', message: 'ICU病房检测到疑似感染暴发趋势，请及时处理', time: '5分钟前', read: false, targetMenu: 'infection-warning' },
        { id: 'approval-fallback-1', type: 'approval', title: '待审核病例', message: '新增3例感染病例待审核确认', time: '15分钟前', read: false, targetMenu: 'infection-case' },
        { id: 'warning-fallback-2', type: 'warning', title: '环境监测异常', message: '手术室空气菌落数超标，需重新监测', time: '1小时前', read: false, targetMenu: 'env-hygiene' },
        { id: 'system-fallback-1', type: 'system', title: '系统更新', message: '系统已升级至v1.1版本，新增数据导出功能', time: '2小时前', read: true, targetMenu: 'dashboard' },
        { id: 'approval-fallback-2', type: 'approval', title: '报告审批', message: '12月份感染月报待审批', time: '3小时前', read: true, targetMenu: 'data-report' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length;

  // Handle notification click - navigate to relevant page
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read locally
    setReadIds(prev => new Set([...prev, notification.id]));

    // Navigate to target page
    const targetMenu = getTargetMenu(notification);
    setActiveMenu(targetMenu);

    // Close notification panel
    onClose();
  };

  // Handle "查看全部通知" - navigate to warnings page
  const handleViewAll = () => {
    setActiveMenu('infection-warning');
    onClose();
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'approval': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'system': return <Info size={16} className="text-sky-500" />;
      case 'info': return <Bell size={16} className="text-blue-400" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'warning': return '预警';
      case 'approval': return '审批';
      case 'system': return '系统';
      case 'info': return '通知';
      default: return '通知';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-14 right-24 w-96 max-h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell size={18} className="text-emerald-600" /> 通知中心
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {unreadCount} 未读
              </Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={() => setReadIds(new Set(notifications.map(n => n.id)))}
                className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                全部已读
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[380px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span className="ml-2 text-sm text-slate-500">加载中...</span>
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-center">
              <Info size={24} className="mx-auto text-amber-500 mb-2" />
              <p className="text-sm text-slate-500">{error}</p>
              <button onClick={fetchNotifications} className="mt-2 text-xs text-emerald-600 hover:text-emerald-500">
                重试
              </button>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="p-6 text-center">
              <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">暂无通知</p>
            </div>
          )}

          {!loading && !error && notifications.map(n => {
            const isRead = n.read || readIds.has(n.id);
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer group transition-all duration-150
                  ${!isRead ? 'bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}
                  ${!isRead ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-medium truncate ${isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {n.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          n.type === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          n.type === 'approval' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          n.type === 'system' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {typeLabel(n.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                        <ExternalLink size={12} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className={`text-xs mt-0.5 line-clamp-2 ${isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{n.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - View All */}
        <div className="p-3 text-center border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={handleViewAll}
            className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            查看全部通知
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
