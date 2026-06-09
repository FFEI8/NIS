'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import type { MenuItem } from '@/types';
import { useDarkMode } from '@/components/shared/dark-mode';
import { NotificationCenter } from '@/components/layout/notifications';
import { UserProfileDialog } from '@/components/layout/user-profile';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Moon, Bell, ChevronDown, ChevronRight, User, LogOut, Home as HomeIcon } from 'lucide-react';

// ============ Real-time Clock ============
function RealTimeClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <Clock size={13} />
      <span>{time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
}

// ============ Breadcrumb ============
function BreadcrumbNav() {
  const { activeMenu, userMenus } = useAppStore();

  const getBreadcrumb = useCallback(() => {
    const crumbs: { label: string; code: string }[] = [{ label: '首页', code: 'dashboard' }];
    const findMenu = (menus: MenuItem[], target: string, path: MenuItem[] = []): MenuItem[] | null => {
      for (const m of menus) {
        if (m.code === target) return [...path, m];
        if (m.children?.length) {
          const found = findMenu(m.children, target, [...path, m]);
          if (found) return found;
        }
      }
      return null;
    };
    const found = findMenu(userMenus, activeMenu);
    if (found) {
      found.forEach(m => crumbs.push({ label: m.name, code: m.code }));
    }
    return crumbs;
  }, [activeMenu, userMenus]);

  const crumbs = getBreadcrumb();

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      {crumbs.map((c, i) => (
        <span key={`${c.code}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />}
          <span className={i === crumbs.length - 1 ? 'text-slate-800 dark:text-slate-200 font-medium' : 'hover:text-emerald-600 cursor-pointer'}
            onClick={() => i < crumbs.length - 1 && useAppStore.getState().setActiveMenu(c.code)}>
            {i === 0 && <HomeIcon size={13} className="inline mr-0.5" />}
            {c.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

// ============ Header ============
export default function Header() {
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { dark, toggle } = useDarkMode();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count periodically
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUnreadCount(data.data.unreadCount || 0);
          }
        }
      } catch {
        // Silently fail - don't disrupt UI
      }
    };
    fetchUnread();
    // Refresh every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-6 shadow-sm z-40">
        <div className="flex-1 flex items-center gap-4">
          <BreadcrumbNav />
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <RealTimeClock />
          {/* Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={toggle} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {/* Notification bell */}
          <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">{currentUser?.name}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentUser?.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser?.dept} · {currentUser?.roles?.map((r: any) => r.name).join(', ')}</div>
                </div>
                <button onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2">
                  <User size={15} /> 个人资料
                </button>
                <button onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                  <LogOut size={15} /> 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <NotificationCenter open={showNotifications} onClose={() => setShowNotifications(false)} />
      <UserProfileDialog open={showProfile} onClose={() => setShowProfile(false)} currentUser={currentUser} />
    </>
  );
}
