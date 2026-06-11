import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};

    if (searchParams.get('triggerSource')) {
      where.triggerSource = searchParams.get('triggerSource');
    }
    if (searchParams.get('warningLevel')) {
      where.warningLevel = searchParams.get('warningLevel');
    }
    if (searchParams.get('status')) {
      where.status = searchParams.get('status');
    }

    const [items, total] = await Promise.all([
      db.warningRuleLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.warningRuleLog.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
