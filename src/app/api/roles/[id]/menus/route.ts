import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { menuIds } = await request.json();
    await db.roleMenu.deleteMany({ where: { roleId: id } });
    if (menuIds?.length) {
      await db.roleMenu.createMany({ data: menuIds.map((menuId: string) => ({ roleId: id, menuId })) });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
