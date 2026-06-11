import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [total, enabledCount, disabledCount, riskCount] = await Promise.all([
      db.hisInfectiousDiseaseTestMapping.count(),
      db.hisInfectiousDiseaseTestMapping.count({ where: { status: 1 } }),
      db.hisInfectiousDiseaseTestMapping.count({ where: { status: 0 } }),
      db.hisInfectiousDiseaseTestMapping.count({ where: { consistencyRisk: { not: null } } }),
    ]);
    return NextResponse.json({
      success: true,
      data: { total, enabledCount, disabledCount, riskCount },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
