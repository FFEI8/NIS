import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildMenuTree } from '@/lib/api-utils';

export async function GET() {
  try {
    const items = await db.menu.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } });
    const tree = buildMenuTree(items);
    return NextResponse.json({ success: true, data: { items, tree } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.menu.create({ data: { parentId: body.parentId || null, name: body.name, code: body.code, path: body.path, icon: body.icon, component: body.component, sort: body.sort ?? 0, type: body.type, visible: body.visible ?? 1, status: body.status ?? 1 } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
