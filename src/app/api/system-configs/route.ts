import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asMap = searchParams.get('asMap') === '1';

    // Build where clause
    const where: any = {};
    if (searchParams.get('category')) where.category = searchParams.get('category');
    if (searchParams.get('configKey')) where.configKey = { contains: searchParams.get('configKey') };

    // Map mode: return as key-value map
    if (asMap) {
      const items = await db.systemConfig.findMany({ where });
      const mapData: Record<string, string> = {};
      for (const item of items) {
        mapData[item.configKey] = item.configValue;
      }
      return NextResponse.json({ success: true, data: mapData });
    }

    // Normal paginated mode
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const [items, total] = await Promise.all([
      db.systemConfig.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.systemConfig.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.systemConfig.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
