import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { permissionIds } = await request.json();
    await db.rolePermission.deleteMany({ where: { roleId: id } });
    if (permissionIds?.length) {
      await db.rolePermission.createMany({ data: permissionIds.map((permissionId: string) => ({ roleId: id, permissionId })) });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
