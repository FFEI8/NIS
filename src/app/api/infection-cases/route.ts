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
    if (searchParams.get('infectionSite')) where.infectionSite = searchParams.get('infectionSite');
    if (searchParams.get('patientName')) where.patientName = { contains: searchParams.get('patientName') };

    const [items, total] = await Promise.all([
      db.infectionCase.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.infectionCase.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.infectionCase.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
