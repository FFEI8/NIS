import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};
    if (searchParams.get('specimenType')) where.specimenType = searchParams.get('specimenType');
    if (searchParams.get('mdroType')) where.mdroType = searchParams.get('mdroType');
    if (searchParams.get('isMDRO')) where.isMDRO = parseInt(searchParams.get('isMDRO') || '1');
    if (searchParams.get('isAbnormal')) where.isAbnormal = parseInt(searchParams.get('isAbnormal') || '1');
    if (searchParams.get('dept')) where.dept = searchParams.get('dept');
    if (searchParams.get('status')) where.status = searchParams.get('status');
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword');
      where.OR = [
        { patientId: { contains: kw } },
        { reportItemName: { contains: kw } },
        { patientName: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.microLabResult.findMany({ where, skip, take, orderBy: { reportTime: 'desc' } }),
      db.microLabResult.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.microLabResult.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
