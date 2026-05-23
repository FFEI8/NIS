import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const item = await db.role.update({ where: { id }, data: { code: body.code, name: body.name, description: body.description, sort: body.sort, status: body.status } });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.rolePermission.deleteMany({ where: { roleId: id } });
    await db.roleMenu.deleteMany({ where: { roleId: id } });
    await db.userRole.deleteMany({ where: { roleId: id } });
    await db.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
