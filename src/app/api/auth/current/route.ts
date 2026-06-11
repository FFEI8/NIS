import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildMenuTree } from '@/lib/api-utils';
import { getMenuTreeCache, setMenuTreeCache } from '@/lib/menu-cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, username } = body;

    // Step 1: Find user by ID first, then fallback to username lookup
    // This handles the case where database was re-seeded and CUID IDs changed
    let user = userId ? await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        phone: true,
        email: true,
        dept: true,
        status: true,
        roles: {
          select: {
            roleId: true,
          },
        },
      },
    }) : null;

    // Fallback: try to find user by username if ID lookup failed
    // This allows session recovery when DB was re-seeded
    if (!user && username) {
      user = await db.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          phone: true,
          email: true,
          dept: true,
          status: true,
          roles: {
            select: {
              roleId: true,
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    if (user.status !== 1) {
      return NextResponse.json({ success: false, message: '该用户已被禁用' }, { status: 403 });
    }

    const roleIds = user.roles.map(ur => ur.roleId);

    // Step 2-4: Fetch role info, permission codes, and menu IDs in parallel
    const [rolesInfo, permResult, menuIdResult] = await Promise.all([
      db.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, code: true, name: true },
      }),
      db.rolePermission.findMany({
        where: { roleId: { in: roleIds } },
        select: { permission: { select: { code: true } } },
      }),
      db.roleMenu.findMany({
        where: { roleId: { in: roleIds } },
        select: { menuId: true },
      }),
    ]);

    // Deduplicate permission codes
    const permissions = [...new Set(permResult.map(rp => rp.permission.code))];

    // Deduplicate menu IDs
    const menuIds = [...new Set(menuIdResult.map(rm => rm.menuId))];

    // Step 5: Build menu tree (with caching)
    const menuIdsKey = menuIds.sort().join(',');
    let menuTree: any[];

    const cachedTree = getMenuTreeCache(menuIdsKey);
    if (cachedTree) {
      menuTree = cachedTree;
    } else {
      const menus = await db.menu.findMany({
        where: { id: { in: menuIds }, status: 1, visible: 1 },
        select: {
          id: true,
          parentId: true,
          name: true,
          code: true,
          path: true,
          icon: true,
          component: true,
          sort: true,
          type: true,
          visible: true,
          status: true,
        },
        orderBy: { sort: 'asc' },
      });
      menuTree = buildMenuTree(menus, true);
      setMenuTreeCache(menuIdsKey, menuTree);
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          email: user.email,
          dept: user.dept,
          status: user.status,
          roles: rolesInfo.map(r => ({
            id: r.id,
            code: r.code,
            name: r.name,
          })),
        },
        permissions,
        menus: menuTree,
      },
    });
  } catch (error: any) {
    console.error('[auth/current] Internal error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}
