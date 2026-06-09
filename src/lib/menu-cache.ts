/**
 * Menu tree cache module.
 *
 * IMPORTANT: In Next.js dev mode (Turbopack), API route handlers may be
 * compiled and loaded as separate modules, meaning each route gets its own
 * copy of this module's top-level variables. This causes cache invalidation
 * in one route (e.g. PUT /api/menus) to be invisible to another route
 * (e.g. POST /api/auth/current).
 *
 * To avoid stale-cache bugs, the in-memory cache is DISABLED in development.
 * In production builds, module-level variables are shared across routes, so
 * the cache works correctly.
 */

const isDev = process.env.NODE_ENV === 'development';

let menuTreeCache: { data: any[]; menuIdsKey: string; timestamp: number } | null = null;
const MENU_TREE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getMenuTreeCache(menuIdsKey: string): any[] | null {
  // Skip cache in development mode to avoid stale data from module isolation
  if (isDev) return null;

  if (menuTreeCache && menuTreeCache.menuIdsKey === menuIdsKey && Date.now() - menuTreeCache.timestamp < MENU_TREE_CACHE_TTL) {
    return menuTreeCache.data;
  }
  return null;
}

export function setMenuTreeCache(menuIdsKey: string, data: any[]) {
  // Skip caching in development mode
  if (isDev) return;

  menuTreeCache = { data, menuIdsKey, timestamp: Date.now() };
}

export function invalidateMenuTreeCache() {
  menuTreeCache = null;
}
