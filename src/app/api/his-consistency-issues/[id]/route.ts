import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/his-consistency-issues/[id] - Get by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.hisConsistencyIssue.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, message: '一致性问题不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/his-consistency-issues/[id] - Update (whitelist fields)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check existence first
    const existing = await db.hisConsistencyIssue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '一致性问题不存在' }, { status: 404 });
    }

    const body = await request.json();

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'scenarioId', 'field', 'issueType', 'severity',
      'description', 'suggestion', 'status',
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

    const item = await db.hisConsistencyIssue.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/his-consistency-issues/[id] - Soft delete (set status=0)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check existence first
    const existing = await db.hisConsistencyIssue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '一致性问题不存在' }, { status: 404 });
    }

    // Soft delete: set status=0
    await db.hisConsistencyIssue.update({ where: { id }, data: { status: 0 } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
