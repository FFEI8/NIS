import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalInfections = await db.infectionCase.count();
    const monthInfections = await db.infectionCase.count({ where: { infectionDate: { gte: monthStart } } });
    const pendingWarnings = await db.warningRecord.count({ where: { status: '待处理' } });
    const mdroCount = await db.infectionCase.count({ where: { pathogen: { contains: '耐药' } } });
    const exposureCount = await db.occupationalExposure.count();

    // Antibiotic usage rate
    const antibioticData = await db.antibioticUsage.findMany();
    const antibioticUsageRate = antibioticData.length > 0
      ? antibioticData.reduce((sum, d) => sum + d.usageRate, 0) / antibioticData.length
      : 0;

    // Hand hygiene rate
    const handHygieneData = await db.handHygiene.findMany();
    const handHygieneRate = handHygieneData.length > 0
      ? handHygieneData.reduce((sum, d) => sum + d.complianceRate, 0) / handHygieneData.length
      : 0;

    // Environmental hygiene rate
    const envData = await db.environmentalMonitor.findMany();
    const envQualified = envData.filter(d => d.result === '合格').length;
    const envHygieneRate = envData.length > 0 ? (envQualified / envData.length) * 100 : 0;

    // Infection trend - last 12 months
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    
    const allCases = await db.infectionCase.findMany();
    const infectionTrend = months.map(m => {
      const count = allCases.filter(c => {
        const d = new Date(c.infectionDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === m;
      }).length;
      return { month: m, count };
    });

    // Site distribution
    const siteMap = new Map<string, number>();
    allCases.forEach(c => {
      siteMap.set(c.infectionSite, (siteMap.get(c.infectionSite) || 0) + 1);
    });
    const siteDistribution = Array.from(siteMap.entries()).map(([site, count]) => ({ site, count }));

    // Dept infection rate
    const deptMap = new Map<string, { total: number; infected: number }>();
    allCases.forEach(c => {
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
