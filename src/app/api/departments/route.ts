import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};
    if (searchParams.get('type')) where.type = searchParams.get('type');
    if (searchParams.get('status')) where.status = parseInt(searchParams.get('status')!);
    if (searchParams.get('keyword')) {
      where.OR = [
        { name: { contains: searchParams.get('keyword') } },
        { code: { contains: searchParams.get('keyword') } },
      ];
    }

    const [items, total] = await Promise.all([
      db.department.findMany({ where, skip, take, orderBy: { sort: 'asc' } }),
      db.department.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.department.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
