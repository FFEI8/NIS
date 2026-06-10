import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.scenarioId || !body.systemField || !body.systemLabel || !body.dataType) {
      return NextResponse.json(
        { success: false, message: 'scenarioId, systemField, systemLabel, dataType are required' },
        { status: 400 }
      );
    }

    // Check for unique constraint
    const existing = await db.hisFieldMapping.findFirst({
      where: {
        scenarioId: body.scenarioId,
        systemField: body.systemField,
        status: 1,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `字段 ${body.systemField} 在场景 ${body.scenarioId} 中已存在` },
        { status: 409 }
      );
    }

    const data: any = {
      scenarioId: body.scenarioId,
      systemField: body.systemField,
      systemLabel: body.systemLabel,
      dataType: body.dataType,
      length: body.length ?? 50,
      required: body.required ? 1 : 0,
      hisField: body.hisField ?? null,
      hisTable: body.hisTable ?? null,
      transformRule: body.transformRule ?? null,
      specialLogic: body.specialLogic ?? null,
      validationRule: body.validationRule ?? null,
      consistencyRisk: body.consistencyRisk ?? null,
      sort: body.sort ?? 0,
      status: 1,
    };

    const item = await db.hisFieldMapping.create({ data });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
