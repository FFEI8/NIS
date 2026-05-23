import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const items = await db.permission.findMany({ orderBy: [{ module: 'asc' }, { sort: 'asc' }] });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.permission.create({ data: { code: body.code, name: body.name, type: body.type, module: body.module, description: body.description, sort: body.sort ?? 0 } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
