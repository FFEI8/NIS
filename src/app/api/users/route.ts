import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const [items, total] = await Promise.all([
      db.user.findMany({ skip, take, include: { roles: { include: { role: true } } }, orderBy: { createdAt: 'desc' } }),
      db.user.count(),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await db.user.create({ data: { username: body.username, password: body.password, name: body.name, phone: body.phone, email: body.email, dept: body.dept, status: body.status ?? 1 } });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
