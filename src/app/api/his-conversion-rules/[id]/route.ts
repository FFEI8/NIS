import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/his-conversion-rules/[id] - Get by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.hisConversionRule.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, message: '转换规则不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/his-conversion-rules/[id] - Update (whitelist fields)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check existence first
    const existing = await db.hisConversionRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '转换规则不存在' }, { status: 404 });
    }

    const body = await request.json();

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'category', 'sourceFormat', 'targetFormat', 'conversionFunction',
      'example', 'description', 'status',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: '没有可更新的字段' }, { status: 400 });
    }

    const item = await db.hisConversionRule.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/his-conversion-rules/[id] - Soft delete (set status=0)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check existence first
    const existing = await db.hisConversionRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '转换规则不存在' }, { status: 404 });
    }

    // Soft delete: set status=0
    await db.hisConversionRule.update({ where: { id }, data: { status: 0 } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
