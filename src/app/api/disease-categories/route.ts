import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};
    if (searchParams.get('category')) where.category = searchParams.get('category');
    if (searchParams.get('isNotifiable')) where.isNotifiable = parseInt(searchParams.get('isNotifiable')!);
    if (searchParams.get('keyword')) {
      where.OR = [
        { diseaseName: { contains: searchParams.get('keyword') } },
        { diseaseCode: { contains: searchParams.get('keyword') } },
      ];
    }

    const [items, total] = await Promise.all([
      db.diseaseCategory.findMany({ where, skip, take, orderBy: { sort: 'asc' } }),
      db.diseaseCategory.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.diseaseCategory.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
