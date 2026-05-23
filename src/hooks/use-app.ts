'use client';

import { useAppStore } from '@/store/app-store';
import type { User, MenuItem } from '@/types';

/**
 * Hook to access current user info
 */
export function useCurrentUser() {
  const currentUser = useAppStore((s) => s.currentUser);
  const userInfoLoading = useAppStore((s) => s.userInfoLoading);
  const loadUserInfo = useAppStore((s) => s.loadUserInfo);
  const hasRole = useAppStore((s) => s.hasRole);

  return {
    user: currentUser,
    isLoading: userInfoLoading,
    loadUserInfo,
    isAdmin: hasRole('admin'),
    isDoctor: hasRole('doctor'),
    isNurse: hasRole('nurse'),
    isInfectionController: hasRole('infection_controller'),
    isLoggedIn: currentUser !== null,
  };
}

/**
 * Hook to check permissions
 */
export function usePermission() {
  const hasPermission = useAppStore((s) => s.hasPermission);
  const hasAnyPermission = useAppStore((s) => s.hasAnyPermission);
  const hasMenu = useAppStore((s) => s.hasMenu);
  const userPermissions = useAppStore((s) => s.userPermissions);

  return {
    hasPermission,
    hasAnyPermission,
    hasMenu,
    permissions: userPermissions,
  };
}

/**
 * Hook for sidebar state management
 */
export function useSidebar() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return {
    collapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    toggle: toggleSidebar,
  };
}

/**
 * Hook for active menu management
 */
export function useActiveMenu() {
  const activeMenu = useAppStore((s) => s.activeMenu);
  const setActiveMenu = useAppStore((s) => s.setActiveMenu);
  const userMenus = useAppStore((s) => s.userMenus);

  return {
    activeMenu,
    setActiveMenu,
    menus: userMenus,
  };
}

/**
 * Hook for authentication actions
 */
export function useAuth() {
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const loginLoading = useAppStore((s) => s.loginLoading);
  const currentUser = useAppStore((s) => s.currentUser);

  return {
    login,
    logout,
    isLoggingIn: loginLoading,
    isAuthenticated: currentUser !== null,
  };
}

/**
 * Flatten menu tree into a list of visible menu items with their paths
 */
export function useFlattenedMenus(): MenuItem[] {
  const userMenus = useAppStore((s) => s.userMenus);

  const flatten = (menus: MenuItem[]): MenuItem[] => {
    const result: MenuItem[] = [];
    for (const menu of menus) {
      if (menu.visible === 1 && menu.status === 1) {
        result.push(menu);
        if (menu.children?.length) {
          result.push(...flatten(menu.children));
        }
      }
    }
    return result;
  };

  return flatten(userMenus);
}

/**
 * Get user display name or fallback to username
 */
export function useUserDisplayName(): string {
  const currentUser = useAppStore((s) => s.currentUser);
  if (!currentUser) return '';
  return currentUser.name || currentUser.username;
}

/**
 * Get user role names as a comma-separated string
 */
export function useUserRoleNames(): string {
  const currentUser = useAppStore((s) => s.currentUser);
  if (!currentUser?.roles?.length) return '';
  return currentUser.roles.map((r) => r.name).join('、');
}

/**
 * Get user's department name
 */
export function useUserDept(): string {
  const currentUser = useAppStore((s) => s.currentUser);
  return currentUser?.dept ?? '';
}
