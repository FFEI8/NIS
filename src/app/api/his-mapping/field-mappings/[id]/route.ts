import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.hisFieldMapping.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Field mapping not found' },
        { status: 404 }
      );
    }

    const data: any = {};
    if (body.hisField !== undefined) data.hisField = body.hisField;
    if (body.hisTable !== undefined) data.hisTable = body.hisTable;
    if (body.transformRule !== undefined) data.transformRule = body.transformRule;
    if (body.specialLogic !== undefined) data.specialLogic = body.specialLogic;
    if (body.validationRule !== undefined) data.validationRule = body.validationRule;
    if (body.consistencyRisk !== undefined) data.consistencyRisk = body.consistencyRisk;
    if (body.required !== undefined) data.required = body.required ? 1 : 0;
    if (body.systemLabel !== undefined) data.systemLabel = body.systemLabel;
    if (body.dataType !== undefined) data.dataType = body.dataType;
    if (body.length !== undefined) data.length = body.length;
    if (body.sort !== undefined) data.sort = body.sort;
    if (body.status !== undefined) data.status = body.status;

    const item = await db.hisFieldMapping.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.hisFieldMapping.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Field mapping not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to 0
    await db.hisFieldMapping.update({ where: { id }, data: { status: 0 } });
    return NextResponse.json({ success: true, message: 'Field mapping deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
