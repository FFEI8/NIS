import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';

// GET /api/his-consistency-issues - List with pagination, filtering by scenarioId, issueType, severity
export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);

    const where: any = {};

    // Filter by scenarioId
    const scenarioId = searchParams.get('scenarioId');
    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    // Filter by issueType
    const issueType = searchParams.get('issueType');
    if (issueType) {
      where.issueType = issueType;
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

    // Keyword search on field, issueType, description, suggestion
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword')!;
      where.OR = [
        { field: { contains: kw } },
        { issueType: { contains: kw } },
        { description: { contains: kw } },
        { suggestion: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.hisConsistencyIssue.findMany({
        where,
        skip,
        take,
        orderBy: [{ scenarioId: 'asc' }, { sort: 'asc' }],
      }),
      db.hisConsistencyIssue.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/his-consistency-issues - Create new consistency issue
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { scenarioId, field, issueType, description } = body;
    if (!scenarioId || !field || !issueType || !description) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段: scenarioId, field, issueType, description' },
        { status: 400 }
      );
    }

    const item = await db.hisConsistencyIssue.create({ data: body });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
