/**
 * Shared menu tree cache with invalidation support.
 * Used by login and current-user APIs to avoid rebuilding identical trees.
 * Can be invalidated when menus are modified (CRUD operations).
 */

let menuTreeCache: { data: any[]; menuIdsKey: string; timestamp: number } | null = null;
const MENU_TREE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getMenuTreeCache(menuIdsKey: string): any[] | null {
  if (menuTreeCache && menuTreeCache.menuIdsKey === menuIdsKey && Date.now() - menuTreeCache.timestamp < MENU_TREE_CACHE_TTL) {
    return menuTreeCache.data;
  }
  return null;
}

export function setMenuTreeCache(menuIdsKey: string, data: any[]) {
  menuTreeCache = { data, menuIdsKey, timestamp: Date.now() };
}

export function invalidateMenuTreeCache() {
  menuTreeCache = null;
}
