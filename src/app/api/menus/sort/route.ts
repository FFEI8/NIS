import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { items } = await request.json() as { items: { id: string; sort: number }[] };
    for (const item of items) {
      await db.menu.update({ where: { id: item.id }, data: { sort: item.sort } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
