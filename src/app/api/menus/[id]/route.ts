import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const item = await db.menu.update({ where: { id }, data: { parentId: body.parentId || null, name: body.name, code: body.code, path: body.path, icon: body.icon, component: body.component, sort: body.sort, type: body.type, visible: body.visible, status: body.status } });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.roleMenu.deleteMany({ where: { menuId: id } });
    const children = await db.menu.findMany({ where: { parentId: id } });
    for (const child of children) {
      await db.roleMenu.deleteMany({ where: { menuId: child.id } });
      await db.menu.delete({ where: { id: child.id } });
    }
    await db.menu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
