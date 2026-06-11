'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import type { MenuItem } from '@/types';
import { LucideIcon } from '@/components/shared/icons';
import { Hospital, ChevronRight, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { userMenus, sidebarCollapsed, toggleSidebar, activeMenu, setActiveMenu, currentUser, logout } = useAppStore();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['infection-monitor', 'infectious-disease', 'data-analysis', 'env-monitor', 'occupational-safety', 'system', 'his-integration-mgmt']));
  const [animating, setAnimating] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

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
    return items.map((menu, idx) => {
      const isActive = activeMenu === menu.code;
      const isExpanded = expandedMenus.has(menu.code);
      const hasChildren = menu.children && menu.children.length > 0;
      const isTopLevel = depth === 0;
      const showDivider = isTopLevel && idx > 0;
      const isHovered = hoveredMenu === menu.code;

      return (
        <div key={menu.id}>
          {/* Divider between top-level menu groups */}
          {showDivider && (
            <div className="mx-4 my-1.5 border-t border-slate-700/50" />
          )}
          <div
            className={`flex items-center gap-2.5 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200 group relative
              ${isActive && !hasChildren
                ? 'bg-emerald-600/20 text-emerald-400 border-l-[3px] border-emerald-500'
                : `text-slate-400 hover:bg-white/5 hover:text-white ${isHovered && !hasChildren ? 'translate-x-0.5' : ''}`
              }
            `}
            style={{ paddingLeft: `${isActive && !hasChildren ? 9 : 12 + depth * 16}px`, paddingRight: '12px' }}
            onClick={() => handleMenuClick(menu)}
            onMouseEnter={() => setHoveredMenu(menu.code)}
            onMouseLeave={() => setHoveredMenu(null)}
            title={sidebarCollapsed ? menu.name : undefined}
          >
            {/* Active left border indicator with glow */}
            {isActive && !hasChildren && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            )}
            {/* Hover background glow for non-active items */}
            {!isActive && !hasChildren && isHovered && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
            )}
            <LucideIcon name={menu.icon} size={18} className={`flex-shrink-0 transition-all duration-200 ${isActive ? 'text-emerald-400' : isHovered ? 'text-slate-200 scale-110' : 'text-slate-500 group-hover:text-slate-300'}`} />
            {!sidebarCollapsed && (
              <>
                <span className={`flex-1 text-sm font-medium truncate transition-colors duration-200 ${isActive ? 'text-emerald-400' : ''}`}>{menu.name}</span>
                {hasChildren && (
                  <ChevronRight size={14} className={`text-slate-500 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-90' : ''} group-hover:text-slate-300`} />
                )}
              </>
            )}
            {/* Tooltip for collapsed items */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                {menu.name}
              </div>
            )}
          </div>
          {/* Animated children container with smoother transition */}
          {hasChildren && !sidebarCollapsed && (
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {renderMenuItems(menu.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className={`h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo header */}
      <div className="flex items-center h-14 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Hospital size={22} className="text-emerald-400 flex-shrink-0 transition-transform duration-200 hover:scale-110" />
            <span className="text-sm font-bold text-white truncate animate-in fade-in duration-300">感染管理系统</span>
          </div>
        )}
        {sidebarCollapsed && (
          <Hospital size={22} className="text-emerald-400 mx-auto transition-transform duration-200 hover:scale-110" />
        )}
      </div>

      {/* Navigation area */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {renderMenuItems(visibleMenus)}
      </nav>

      {/* Collapse toggle button */}
      <div className="border-t border-slate-800">
        <button
          onClick={handleToggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-emerald-400 hover:bg-slate-800/50 transition-all duration-200 active:scale-95"
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          <div className={`transition-transform duration-300 ${animating ? 'scale-75' : 'scale-100'}`}>
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </div>
          {!sidebarCollapsed && (
            <span className="text-xs transition-opacity duration-200">收起侧边栏</span>
          )}
        </button>
      </div>

      {/* User info at bottom of sidebar */}
      {currentUser && (
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 group/avatar">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-600/20 transition-transform duration-200 group-hover/avatar:scale-110">
                {currentUser.name?.[0] || 'U'}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate font-medium">{currentUser.name}</div>
                <div className="text-xs text-slate-500 truncate">{currentUser.dept}</div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 opacity-0 group-hover/sidebar:opacity-100"
                title="退出登录"
                style={{ opacity: 1 }}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
