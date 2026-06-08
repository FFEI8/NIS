import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ============ Simple counts (use count() instead of findMany) ============
    const [
      totalInfections,
      monthInfections,
      pendingWarnings,
      mdroCount,
      exposureCount,
    ] = await Promise.all([
      db.infectionCase.count(),
      db.infectionCase.count({ where: { infectionDate: { gte: monthStart } } }),
      db.warningRecord.count({ where: { status: '待处理' } }),
      db.infectionCase.count({ where: { pathogen: { contains: '耐药' } } }),
      db.occupationalExposure.count(),
    ]);

    // ============ Aggregation queries instead of fetch-all ============

    // Antibiotic usage rate - use aggregate
    const antibioticAgg = await db.antibioticUsage.aggregate({
      _avg: { usageRate: true },
      _count: true,
    });
    const antibioticUsageRate = antibioticAgg._count > 0 ? (antibioticAgg._avg.usageRate ?? 0) : 0;

    // Hand hygiene rate - use aggregate
    const handHygieneAgg = await db.handHygiene.aggregate({
      _avg: { complianceRate: true },
      _count: true,
    });
    const handHygieneRate = handHygieneAgg._count > 0 ? (handHygieneAgg._avg.complianceRate ?? 0) : 0;

    // Environmental hygiene rate - use count for qualified vs total
    const [envTotal, envQualified] = await Promise.all([
      db.environmentalMonitor.count(),
      db.environmentalMonitor.count({ where: { result: '合格' } }),
    ]);
    const envHygieneRate = envTotal > 0 ? (envQualified / envTotal) * 100 : 0;

    // ============ Infection trend & distribution (need select for minimal data) ============
    // Only fetch the fields needed for trend/site/dept calculations
    const casesForAnalytics = await db.infectionCase.findMany({
      select: {
        infectionDate: true,
        infectionSite: true,
        dept: true,
      },
    });

    // Infection trend - last 12 months
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const infectionTrend = months.map(m => {
      const count = casesForAnalytics.filter(c => {
        const d = new Date(c.infectionDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === m;
      }).length;
      return { month: m, count };
    });

    // Site distribution
    const siteMap = new Map<string, number>();
    casesForAnalytics.forEach(c => {
      siteMap.set(c.infectionSite, (siteMap.get(c.infectionSite) || 0) + 1);
    });
    const siteDistribution = Array.from(siteMap.entries()).map(([site, count]) => ({ site, count }));

    // Dept infection rate
    const deptMap = new Map<string, { total: number; infected: number }>();
    casesForAnalytics.forEach(c => {
      const d = deptMap.get(c.dept) || { total: 100, infected: 0 };
      d.infected++;
      deptMap.set(c.dept, d);
    });
    const deptInfectionRate = Array.from(deptMap.entries()).map(([dept, data]) => ({
      dept,
      rate: Math.round((data.infected / data.total) * 10000) / 100,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalInfections,
        monthInfections,
        pendingWarnings,
        mdroCount,
        antibioticUsageRate: Math.round(antibioticUsageRate * 100) / 100,
        handHygieneRate: Math.round(handHygieneRate * 100) / 100,
        envHygieneRate: Math.round(envHygieneRate * 100) / 100,
        exposureCount,
        infectionTrend,
        siteDistribution,
        deptInfectionRate,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
