import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

// GET /api/his-conversion-rules - List with pagination, filtering by category, search by keyword
export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);

    const where: any = {};

    // Filter by category
    const category = searchParams.get('category');
    if (category) {
      where.category = category;
    }

    // Filter by status (default to active if not specified)
    if (searchParams.get('status') !== null) {
      where.status = parseInt(searchParams.get('status')!);
    }

    // Keyword search on sourceFormat, targetFormat, category, conversionFunction
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword')!;
      where.OR = [
        { sourceFormat: { contains: kw } },
        { targetFormat: { contains: kw } },
        { category: { contains: kw } },
        { conversionFunction: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.hisConversionRule.findMany({
        where,
        skip,
        take,
        orderBy: [{ category: 'asc' }, { sort: 'asc' }],
      }),
      db.hisConversionRule.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/his-conversion-rules - Create new conversion rule
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { category, sourceFormat, targetFormat } = body;
    if (!category || !sourceFormat || !targetFormat) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段: category, sourceFormat, targetFormat' },
        { status: 400 }
      );
    }

    const item = await db.hisConversionRule.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
