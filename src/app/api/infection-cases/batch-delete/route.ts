import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: '请选择要删除的记录' },
        { status: 400 }
      );
    }

    const result = await db.infectionCase.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      message: `成功删除 ${result.count} 条记录`,
      data: { deletedCount: result.count },
    });
  } catch (error: any) {
    console.error('[infection-cases/batch-delete] Error:', error);
    return NextResponse.json(
      { success: false, message: '批量删除失败' },
      { status: 500 }
    );
  }
}
