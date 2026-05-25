import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};

    if (searchParams.get('alertType')) where.alertType = searchParams.get('alertType');
    if (searchParams.get('alertLevel')) where.alertLevel = searchParams.get('alertLevel');
    if (searchParams.get('status')) where.status = searchParams.get('status');

    const [items, total] = await Promise.all([
      db.diseaseAlert.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.diseaseAlert.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.diseaseAlert.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
