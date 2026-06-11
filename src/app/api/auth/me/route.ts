import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildMenuTree } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: '缺少userId参数' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
