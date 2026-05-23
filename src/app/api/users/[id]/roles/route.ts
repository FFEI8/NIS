import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { roleIds } = await request.json();
    await db.userRole.deleteMany({ where: { userId: id } });
    if (roleIds?.length) {
      await db.userRole.createMany({ data: roleIds.map((roleId: string) => ({ userId: id, roleId })) });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
