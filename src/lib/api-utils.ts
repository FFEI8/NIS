import { NextResponse } from 'next/server';

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function getPaginationParams(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function getFilterParams(request: Request, keys: string[]) {
  const { searchParams } = new URL(request.url);
  const filters: Record<string, string> = {};
  for (const key of keys) {
    const val = searchParams.get(key);
    if (val) filters[key] = val;
  }
  return filters;
}

export function buildMenuTree(menus: any[], filterVisible = false): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  // Filter out hidden menus if requested
  const filtered = filterVisible ? menus.filter(m => m.visible === 1) : menus;
  const sorted = [...filtered].sort((a, b) => a.sort - b.sort);

  for (const menu of sorted) {
    map.set(menu.id, { ...menu, children: [] });
  }

  for (const menu of sorted) {
    const node = map.get(menu.id)!;
    if (menu.parentId && map.has(menu.parentId)) {
      map.get(menu.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Recursively remove directories that have no visible children
  if (filterVisible) {
    const pruneEmpty = (items: any[]): any[] => {
      return items.filter(item => {
        if (item.children && item.children.length > 0) {
          item.children = pruneEmpty(item.children);
        }
        // Keep the item if it's not a directory, or if it has children
        return item.type !== 'directory' || (item.children && item.children.length > 0);
      });
    };
    return pruneEmpty(roots);
  }

  return roots;
}
