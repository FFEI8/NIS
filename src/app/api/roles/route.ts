import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const items = await db.role.findMany({ include: { permissions: { include: { permission: true } }, menus: { include: { menu: true } } }, orderBy: { sort: 'asc' } });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await db.role.create({ data: { code: body.code, name: body.name, description: body.description, sort: body.sort ?? 0, status: body.status ?? 1 } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
