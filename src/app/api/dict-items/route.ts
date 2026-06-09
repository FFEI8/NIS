import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === '1';

    // Grouped mode: return all items grouped by category
    if (grouped) {
      const where: any = {};
      if (searchParams.get('status')) where.status = parseInt(searchParams.get('status')!);
      if (searchParams.get('category')) where.category = searchParams.get('category');

      const items = await db.dictItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sort: 'asc' }],
      });

      const groupedData: Record<string, typeof items> = {};
      for (const item of items) {
        if (!groupedData[item.category]) {
          groupedData[item.category] = [];
        }
        groupedData[item.category].push(item);
      }
      return NextResponse.json({ success: true, data: groupedData });
    }

    // Normal paginated mode
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const where: any = {};
    if (searchParams.get('category')) where.category = searchParams.get('category');
    if (searchParams.get('status')) where.status = parseInt(searchParams.get('status')!);
    if (searchParams.get('keyword')) {
      where.OR = [
        { name: { contains: searchParams.get('keyword') } },
        { code: { contains: searchParams.get('keyword') } },
      ];
    }

    const [items, total] = await Promise.all([
      db.dictItem.findMany({ where, skip, take, orderBy: [{ category: 'asc' }, { sort: 'asc' }] }),
      db.dictItem.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.dictItem.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
