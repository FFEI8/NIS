'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import type { MenuItem } from '@/types';
import { LucideIcon } from '@/components/shared/icons';
import { Hospital, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Sidebar() {
  const { userMenus, sidebarCollapsed, toggleSidebar, activeMenu, setActiveMenu, currentUser } = useAppStore();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['infection-monitor', 'infectious-disease', 'data-analysis', 'env-monitor', 'occupational-safety', 'system']));
  const [animating, setAnimating] = useState(false);

  const toggleExpand = (code: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleMenuClick = (menu: MenuItem) => {
    if (menu.type === 'directory') {
      toggleExpand(menu.code);
    } else {
      setActiveMenu(menu.code);
    }
  };

  const handleToggleSidebar = () => {
    setAnimating(true);
    toggleSidebar();
    setTimeout(() => setAnimating(false), 300);
  };

  /**
   * Filter menus: only show visible and enabled items.
   * Compute visibleChildren after filtering so directories with all-hidden children
   * don't show an empty expandable section.
   */
  const filterVisibleMenus = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(m => m.visible === 1 && m.status === 1)
      .map(m => {
        if (m.children && m.children.length > 0) {
          const visibleChildren = filterVisibleMenus(m.children);
          return { ...m, children: visibleChildren };
        }
        return m;
      })
      .filter(m => m.type !== 'directory' || (m.children && m.children.length > 0));
  };

  const visibleMenus = filterVisibleMenus(userMenus);

  const renderMenuItems = (items: MenuItem[], depth = 0) => {
    return items.map(menu => {
      const isActive = activeMenu === menu.code;
      const isExpanded = expandedMenus.has(menu.code);
      const hasChildren = menu.children && menu.children.length > 0;

      return (
        <div key={menu.id}>
          <div
            className={`flex items-center gap-2.5 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200 group relative
              ${isActive && !hasChildren ? 'bg-emerald-600/15 text-emerald-400 dark:text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
            style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: '12px' }}
            onClick={() => handleMenuClick(menu)}
          >
            {/* Active left border indicator */}
            {isActive && !hasChildren && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full" />
            )}
            <LucideIcon name={menu.icon} size={18} className={`flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-sm font-medium truncate">{menu.name}</span>
                {hasChildren && (
                  <ChevronRight size={14} className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                )}
              </>
            )}
          </div>
          {/* Animated children container */}
          {hasChildren && !sidebarCollapsed && (
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {renderMenuItems(menu.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className={`h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center h-14 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Hospital size={22} className="text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white truncate">感染管理系统</span>
          </div>
        )}
        {sidebarCollapsed && <Hospital size={22} className="text-emerald-400 mx-auto" />}
        <button onClick={handleToggleSidebar}
          className={`${sidebarCollapsed ? 'mx-auto mt-1' : 'ml-auto'} text-slate-400 hover:text-white p-1 rounded transition-colors`}>
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {renderMenuItems(visibleMenus)}
      </nav>
      {/* User info at bottom of sidebar */}
      {currentUser && !sidebarCollapsed && (
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {currentUser.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-500 truncate">{currentUser.dept}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
