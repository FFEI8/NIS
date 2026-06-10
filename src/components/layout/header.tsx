'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import type { MenuItem } from '@/types';
import { useDarkMode } from '@/components/shared/dark-mode';
import { NotificationCenter } from '@/components/layout/notifications';
import { UserProfileDialog } from '@/components/layout/user-profile';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Moon, Bell, ChevronDown, ChevronRight, User, LogOut, Home as HomeIcon, Search, X, Command } from 'lucide-react';

// ============ Real-time Clock ============
function RealTimeClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <Clock size={13} />
      <span className="font-mono tabular-nums">{time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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

// ============ Global Search ============
function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { userMenus, setActiveMenu } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Flatten menus for search
  const getAllMenuItems = useCallback(() => {
    const items: { name: string; code: string; path: string }[] = [];
    const walk = (menus: MenuItem[], parentPath: string = '') => {
      for (const m of menus) {
        const path = parentPath ? `${parentPath} / ${m.name}` : m.name;
        if (m.type !== 'directory') {
          items.push({ name: m.name, code: m.code, path });
        }
        if (m.children?.length) {
          walk(m.children, path);
        }
      }
    };
    walk(userMenus);
    return items;
  }, [userMenus]);

  const allItems = getAllMenuItems();
  const filtered = query.trim()
    ? allItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.path.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 text-sm transition-colors min-w-[180px]"
      >
        <Search size={14} />
        <span className="flex-1 text-left">搜索菜单...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded">
          <Command size={10} />K
        </kbd>
      </button>

      {/* Search modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setOpen(false); setQuery(''); }} />
          {/* Search dialog */}
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <Search size={18} className="text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索菜单或页面..."
                className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none text-sm"
              />
              <button onClick={() => { setOpen(false); setQuery(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            {/* Results */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {query.trim() === '' ? (
                <div className="p-4 text-center text-sm text-slate-400">输入关键词搜索菜单</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">未找到匹配的菜单</div>
              ) : (
                filtered.map(item => (
                  <button
                    key={item.code}
                    onClick={() => { setActiveMenu(item.code); setOpen(false); setQuery(''); }}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-3"
                  >
                    <Search size={14} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.path}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px]">ESC</kbd> 关闭</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px]">↑↓</kbd> 导航</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px]">↵</kbd> 选择</span>
            </div>
          </div>
        </div>
      )}
    </>
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
          <GlobalSearch />
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
          <RealTimeClock />
          {/* Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={toggle} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1" title={dark ? '切换浅色模式' : '切换深色模式'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {/* Notification bell */}
          <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1" title="通知中心">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 outline-none">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">{currentUser?.name}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {currentUser?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{currentUser?.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.dept}</div>
                    </div>
                  </div>
                  {currentUser?.roles?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {currentUser.roles.map((r: any, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded font-medium">{r.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2 focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50">
                  <User size={15} /> 个人资料
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <button onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20">
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
