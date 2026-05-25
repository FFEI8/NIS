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
    if (searchParams.get('diseaseCategory')) where.diseaseCategory = searchParams.get('diseaseCategory');
    if (searchParams.get('diseaseName')) where.diseaseName = { contains: searchParams.get('diseaseName') };

    // Date range filter on diagnosisDate
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      where.diagnosisDate = {};
      if (startDate) where.diagnosisDate.gte = new Date(startDate);
      if (endDate) where.diagnosisDate.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      db.infectiousDiseaseCase.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      db.infectiousDiseaseCase.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.infectiousDiseaseCase.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
