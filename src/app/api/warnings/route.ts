import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};
    if (searchParams.get('type')) where.warningType = searchParams.get('type');
    if (searchParams.get('status')) where.status = searchParams.get('status');
    if (searchParams.get('level')) where.warningLevel = searchParams.get('level');
    if (searchParams.get('dept')) where.dept = searchParams.get('dept');

    const [items, total] = await Promise.all([
      db.warningRecord.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.warningRecord.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.warningRecord.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
