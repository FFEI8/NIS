import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.temperatureRecord.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, message: '体温记录不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Recalculate fever fields if temperature changed
    if (body.temperature !== undefined) {
      const temperature = parseFloat(body.temperature);
      if (temperature < 37.3) {
        body.isAbnormal = 0;
        body.isFever = 0;
        body.feverLevel = '正常';
      } else if (temperature < 38.0) {
        body.isAbnormal = 1;
        body.isFever = 0;
        body.feverLevel = '低热';
      } else if (temperature < 39.0) {
        body.isAbnormal = 1;
        body.isFever = 1;
        body.feverLevel = '中度发热';
      } else if (temperature < 41.0) {
        body.isAbnormal = 1;
        body.isFever = 1;
        body.feverLevel = '高热';
      } else {
        body.isAbnormal = 1;
        body.isFever = 1;
        body.feverLevel = '超高热';
      }
      body.temperature = temperature;
    }

    const item = await db.temperatureRecord.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.temperatureRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
