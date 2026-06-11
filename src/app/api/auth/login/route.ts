import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildMenuTree } from '@/lib/api-utils';
import { getMenuTreeCache, setMenuTreeCache } from '@/lib/menu-cache';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
      return NextResponse.json({ success: false, message: '请输入用户名和密码' }, { status: 400 });
    }

    // Step 1: Find user with minimal data + role IDs only
    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
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

    if (!user || user.password !== password) {
      return NextResponse.json({ success: false, message: '用户名或密码错误' }, { status: 401 });
    }

    if (user.status !== 1) {
      return NextResponse.json({ success: false, message: '该用户已被禁用' }, { status: 403 });
    }

    const roleIds = user.roles.map(ur => ur.roleId);

    // Step 2: Fetch role basic info (parallel with steps 3-4)
    const rolesInfo = db.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, code: true, name: true },
    });

    // Step 3: Fetch permission codes for these roles
    const permissionCodes = db.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      select: { permission: { select: { code: true } } },
    });

    // Step 4: Fetch menu IDs for these roles
    const menuIdsResult = db.roleMenu.findMany({
      where: { roleId: { in: roleIds } },
      select: { menuId: true },
    });

    // Execute all 3 queries in parallel
    const [roles, permResult, menuIdResult] = await Promise.all([rolesInfo, permissionCodes, menuIdsResult]);

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
          roles: roles.map(r => ({
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
    console.error('[auth/login] Internal error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}
