import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

// GET /api/his-validation-rules - List with pagination, filtering by form, ruleType, severity
export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);

    const where: any = {};

    // Filter by form
    const form = searchParams.get('form');
    if (form) {
      where.form = form;
    }

    // Filter by ruleType
    const ruleType = searchParams.get('ruleType');
    if (ruleType) {
      where.ruleType = ruleType;
    }

    // Filter by severity
    const severity = searchParams.get('severity');
    if (severity) {
      where.severity = severity;
    }

    // Filter by status (default to active if not specified)
    if (searchParams.get('status') !== null) {
      where.status = parseInt(searchParams.get('status')!);
    }

    // Keyword search on form, field, ruleDescription, errorMessage
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword')!;
      where.OR = [
        { form: { contains: kw } },
        { field: { contains: kw } },
        { ruleDescription: { contains: kw } },
        { errorMessage: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.hisValidationRule.findMany({
        where,
        skip,
        take,
        orderBy: [{ form: 'asc' }, { sort: 'asc' }],
      }),
      db.hisValidationRule.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/his-validation-rules - Create new validation rule
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { form, field, ruleType, ruleDescription, errorMessage } = body;
    if (!form || !field || !ruleType || !ruleDescription || !errorMessage) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段: form, field, ruleType, ruleDescription, errorMessage' },
        { status: 400 }
      );
    }

    const item = await db.hisValidationRule.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
