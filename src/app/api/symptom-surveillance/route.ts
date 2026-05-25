import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};

    if (searchParams.get('dept')) where.dept = searchParams.get('dept');
    if (searchParams.get('status')) where.status = searchParams.get('status');
    if (searchParams.get('symptomGroup')) where.symptomGroup = searchParams.get('symptomGroup');
    if (searchParams.get('isClustered') !== null) {
      const val = searchParams.get('isClustered');
      if (val !== null) where.isClustered = parseInt(val);
    }

    const [items, total] = await Promise.all([
      db.symptomSurveillance.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.symptomSurveillance.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.symptomSurveillance.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
