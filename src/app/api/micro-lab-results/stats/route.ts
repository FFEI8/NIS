import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Total counts
    const [totalCount, abnormalCount, mdroCount] = await Promise.all([
      db.microLabResult.count(),
      db.microLabResult.count({ where: { isAbnormal: 1 } }),
      db.microLabResult.count({ where: { isMDRO: 1 } }),
    ]);

    // MDRO by type breakdown
    const allMDRO = await db.microLabResult.findMany({
      where: { isMDRO: 1 },
      select: { mdroType: true },
    });
    const mdroByType: Record<string, number> = {};
    for (const r of allMDRO) {
      const t = r.mdroType || '未知';
      mdroByType[t] = (mdroByType[t] || 0) + 1;
    }

    // Specimen type distribution
    const allResults = await db.microLabResult.findMany({
      select: { specimenType: true },
    });
    const specimenDist: Record<string, number> = {};
    for (const r of allResults) {
      specimenDist[r.specimenType] = (specimenDist[r.specimenType] || 0) + 1;
    }

    // Recent MDRO detections (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMDRO = await db.microLabResult.findMany({
      where: {
        isMDRO: 1,
        reportTime: { gte: sevenDaysAgo },
      },
      orderBy: { reportTime: 'desc' },
      take: 20,
    });

    // Monthly trend - last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const monthlyResults = await db.microLabResult.findMany({
      where: { reportTime: { gte: twelveMonthsAgo } },
      select: { reportTime: true, isMDRO: true, isAbnormal: true },
    });

    const monthlyTrend: Record<string, { total: number; mdro: number; abnormal: number }> = {};
    for (const r of monthlyResults) {
      if (!r.reportTime) continue;
      const month = new Date(r.reportTime).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTrend[month]) monthlyTrend[month] = { total: 0, mdro: 0, abnormal: 0 };
      monthlyTrend[month].total++;
      if (r.isMDRO) monthlyTrend[month].mdro++;
      if (r.isAbnormal) monthlyTrend[month].abnormal++;
    }

    // Dept distribution for MDRO
    const mdroResults = await db.microLabResult.findMany({
      where: { isMDRO: 1 },
      select: { dept: true },
    });
    const deptDist: Record<string, number> = {};
    for (const r of mdroResults) {
      const dept = r.dept || '未知科室';
      deptDist[dept] = (deptDist[dept] || 0) + 1;
    }

    // Warning triggered stats
    const warningTriggeredCount = await db.microLabResult.count({
      where: { warningTriggered: 1 },
    });

    return NextResponse.json({
      success: true,
      data: {
        // Flat fields for frontend compatibility
        total: totalCount,
        abnormalCount,
        mdroCount,
        warningCount: warningTriggeredCount,
        abnormalRate: totalCount > 0 ? Math.round((abnormalCount / totalCount) * 10000) / 100 : 0,
        mdroRate: totalCount > 0 ? Math.round((mdroCount / totalCount) * 10000) / 100 : 0,
        // Detailed breakdowns
        overview: {
          totalCount,
          abnormalCount,
          mdroCount,
          abnormalRate: totalCount > 0 ? Math.round((abnormalCount / totalCount) * 10000) / 100 : 0,
          mdroRate: totalCount > 0 ? Math.round((mdroCount / totalCount) * 10000) / 100 : 0,
          warningTriggeredCount,
        },
        mdroByType,
        specimenDist,
        deptDist,
        recentMDRO,
        monthlyTrend,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
