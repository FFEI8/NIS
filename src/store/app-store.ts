import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, MenuItem } from '@/types';

interface AppState {
  // Current user info
  currentUser: User | null;
  userPermissions: string[];
  userMenus: MenuItem[];

  // Sidebar state
  sidebarCollapsed: boolean;
  activeMenu: string;

  // Loading states
  loginLoading: boolean;
  userInfoLoading: boolean;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUserInfo: () => Promise<void>;
  refreshMenus: () => Promise<void>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setActiveMenu: (menuCode: string) => void;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasMenu: (menuCode: string) => boolean;
  hasRole: (roleCode: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      userPermissions: [],
      userMenus: [],
      sidebarCollapsed: false,
      activeMenu: 'dashboard',
      loginLoading: false,
      userInfoLoading: false,

      // Login action
      login: async (username: string, password: string) => {
        set({ loginLoading: true });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          if (!res.ok) {
            set({ loginLoading: false });
            return false;
          }

          const data = await res.json();

          if (data.success && data.data) {
            const { user, permissions, menus } = data.data;
            set({
              currentUser: user,
              userPermissions: Array.isArray(permissions) ? (typeof permissions[0] === 'string' ? permissions : permissions.map((p: { code: string }) => p.code)) : [],
              userMenus: menus ?? [],
              loginLoading: false,
            });
            return true;
          }

          set({ loginLoading: false });
          return false;
        } catch {
          set({ loginLoading: false });
          return false;
        }
      },

      // Logout action
      logout: () => {
        set({
          currentUser: null,
          userPermissions: [],
          userMenus: [],
          activeMenu: 'dashboard',
        });
      },

      // Load user info from API
      loadUserInfo: async () => {
        const { currentUser } = get();
        if (!currentUser?.id && !currentUser?.username) return;
        set({ userInfoLoading: true });
        try {
          const res = await fetch('/api/auth/current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              username: currentUser.username,
            }),
          });

          if (!res.ok) {
            // If user not found (404), clear the session
            if (res.status === 404) {
              set({
                currentUser: null,
                userPermissions: [],
                userMenus: [],
                activeMenu: 'dashboard',
                userInfoLoading: false,
              });
              return;
            }
            set({ userInfoLoading: false });
            return;
          }

          const data = await res.json();

          if (data.success && data.data) {
            const { user, permissions, menus } = data.data;
            set({
              currentUser: user,
              userPermissions: Array.isArray(permissions) ? (typeof permissions[0] === 'string' ? permissions : permissions.map((p: { code: string }) => p.code)) : [],
              userMenus: menus ?? [],
              userInfoLoading: false,
            });
          } else {
            set({ userInfoLoading: false });
          }
        } catch {
          set({ userInfoLoading: false });
        }
      },

      // Refresh only menus (called after menu visibility/structure changes or on page load)
      refreshMenus: async () => {
        const { currentUser } = get();
        if (!currentUser?.id && !currentUser?.username) return;
        try {
          const res = await fetch('/api/auth/current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              username: currentUser.username, // Fallback: allows session recovery when DB was re-seeded
            }),
          });

          if (!res.ok) {
            // If user not found (404), the session is invalid - force logout
            if (res.status === 404) {
              console.warn('[refreshMenus] User not found in DB, clearing session');
              set({
                currentUser: null,
                userPermissions: [],
                userMenus: [],
                activeMenu: 'dashboard',
              });
              return;
            }
            console.warn('[refreshMenus] API returned status:', res.status);
            return;
          }

          const data = await res.json();
          if (data.success && data.data) {
            const { user, menus } = data.data;
            set({
              // Update currentUser with latest data from DB (handles re-seed ID changes)
              currentUser: user || currentUser,
              userMenus: menus ?? [],
            });
          } else {
            console.warn('[refreshMenus] API returned unsuccessful response:', data);
          }
        } catch (err) {
          console.warn('[refreshMenus] Failed to refresh menus:', err);
        }
      },

      // Sidebar actions
      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      // Active menu actions
      setActiveMenu: (menuCode: string) => {
        set({ activeMenu: menuCode });
      },

      // Permission check - check if current user has a specific permission
      hasPermission: (permissionCode: string) => {
        const { userPermissions } = get();
        return userPermissions.includes(permissionCode);
      },

      // Check if current user has any of the specified permissions
      hasAnyPermission: (permissionCodes: string[]) => {
        const { userPermissions } = get();
        return permissionCodes.some((code) => userPermissions.includes(code));
      },

      // Menu check - check if current user has access to a specific menu
      hasMenu: (menuCode: string) => {
        const { userMenus } = get();

        const findMenu = (menus: MenuItem[]): boolean => {
          for (const menu of menus) {
            if (menu.code === menuCode) return true;
            if (menu.children?.length && findMenu(menu.children)) return true;
          }
          return false;
        };

        return findMenu(userMenus);
      },

      // Role check - check if current user has a specific role
      hasRole: (roleCode: string) => {
        const { currentUser } = get();
        if (!currentUser?.roles) return false;
        return currentUser.roles.some((role) => role.code === roleCode);
      },
    }),
    {
      name: 'hims-app-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        userPermissions: state.userPermissions,
        userMenus: state.userMenus,
        sidebarCollapsed: state.sidebarCollapsed,
        activeMenu: state.activeMenu,
      }),
    }
  )
);
