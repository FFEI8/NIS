import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};

    if (searchParams.get('hisTestCode')) {
      where.hisTestCode = searchParams.get('hisTestCode');
    }
    if (searchParams.get('testItemCode')) {
      where.testItemCode = searchParams.get('testItemCode');
    }
    if (searchParams.get('status')) {
      where.status = parseInt(searchParams.get('status') || '1');
    }
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword');
      where.OR = [
        { hisTestCode: { contains: kw } },
        { hisTestName: { contains: kw } },
        { testItemName: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.hisInfectiousDiseaseTestMapping.findMany({ where, skip, take, orderBy: { sort: 'asc' } }),
      db.hisInfectiousDiseaseTestMapping.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.hisInfectiousDiseaseTestMapping.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
