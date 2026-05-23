import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildMenuTree } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    const user = await db.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
                menus: { include: { menu: true } },
              },
            },
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

    const permissions = [...new Set(
      user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.code))
    )];

    const menuIds = [...new Set(
      user.roles.flatMap(ur => ur.role.menus.map(rm => rm.menuId))
    )];

    const menus = await db.menu.findMany({
      where: { id: { in: menuIds }, status: 1 },
      orderBy: { sort: 'asc' },
    });

    const menuTree = buildMenuTree(menus);

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
          roles: user.roles.map(ur => ({
            id: ur.role.id,
            code: ur.role.code,
            name: ur.role.name,
          })),
        },
        permissions,
        menus: menuTree,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
