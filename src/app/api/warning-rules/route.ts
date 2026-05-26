import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};
    if (searchParams.get('category')) where.category = searchParams.get('category');
    if (searchParams.get('ruleType')) where.ruleType = searchParams.get('ruleType');
    if (searchParams.get('warningLevel')) where.warningLevel = searchParams.get('warningLevel');
    if (searchParams.get('enabled')) where.enabled = parseInt(searchParams.get('enabled') || '1');
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword');
      where.OR = [
        { name: { contains: kw } },
        { code: { contains: kw } },
        { description: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.warningRule.findMany({ where, skip, take, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
      db.warningRule.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.warningRule.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
