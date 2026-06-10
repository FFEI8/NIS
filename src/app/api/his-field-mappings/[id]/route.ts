import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.hisFieldMapping.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, message: '字段映射不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check existence first
    const existing = await db.hisFieldMapping.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '字段映射不存在' }, { status: 404 });
    }

    const body = await request.json();
    const item = await db.hisFieldMapping.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check existence first
    const existing = await db.hisFieldMapping.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '字段映射不存在' }, { status: 404 });
    }

    // Soft delete: set status=0
    await db.hisFieldMapping.update({ where: { id }, data: { status: 0 } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
