import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-utils';

// GET /api/his-business-scenarios - List all business scenarios (for dropdowns)
export async function GET() {
  try {
    const items = await db.hisBusinessScenario.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
      select: { id: true, scenarioId: true, name: true, module: true },
    });
    return successResponse(items);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
