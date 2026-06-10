import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);

    const where: any = {};

    // scenarioId is a required filter
    const scenarioId = searchParams.get('scenarioId');
    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    // Optional status filter
    if (searchParams.get('status') !== null) {
      where.status = parseInt(searchParams.get('status')!);
    }

    // Optional keyword search on systemField, systemLabel, hisField
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword')!;
      where.OR = [
        { systemField: { contains: kw } },
        { systemLabel: { contains: kw } },
        { hisField: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.hisFieldMapping.findMany({
        where,
        skip,
        take,
        orderBy: [{ scenarioId: 'asc' }, { sort: 'asc' }],
      }),
      db.hisFieldMapping.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { scenarioId, systemField, systemLabel, dataType } = body;
    if (!scenarioId || !systemField || !systemLabel || !dataType) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段: scenarioId, systemField, systemLabel, dataType' },
        { status: 400 }
      );
    }

    // Check unique constraint on [scenarioId, systemField]
    const existing = await db.hisFieldMapping.findUnique({
      where: { scenarioId_systemField: { scenarioId, systemField } },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `字段映射 [${scenarioId}, ${systemField}] 已存在` },
        { status: 409 }
      );
    }

    const item = await db.hisFieldMapping.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
