import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// MDRO bacteria definitions with static metadata
const MDRO_BACTERIA = [
  { name: 'CRAB', fullName: '鲍曼不动杆菌', keywords: ['鲍曼不动杆菌'], resistance: '耐碳青霉烯', color: 'rose' },
  { name: 'CRKP', fullName: '肺炎克雷伯菌', keywords: ['肺炎克雷伯菌', 'CRKP'], resistance: '耐碳青霉烯', color: 'amber' },
  { name: 'MRSA', fullName: '金黄色葡萄球菌', keywords: ['金黄色葡萄球菌', 'MRSA'], resistance: '耐甲氧西林', color: 'purple' },
  { name: 'VRE', fullName: '屎肠球菌', keywords: ['屎肠球菌', 'VRE'], resistance: '耐万古霉素', color: 'teal' },
  { name: 'CRPA', fullName: '铜绿假单胞菌', keywords: ['铜绿假单胞菌', 'CRPA'], resistance: '耐碳青霉烯', color: 'slate' },
] as const;

export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Fetch all MDRO infection cases
    const mdroCases = await db.infectionCase.findMany({
      where: {
        OR: MDRO_BACTERIA.flatMap((b) =>
          b.keywords.map((kw) => ({ pathogen: { contains: kw } }))
        ),
      },
      select: {
        id: true,
        pathogen: true,
        dept: true,
        infectionDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch MDRO-related warning records
    const mdroWarnings = await db.warningRecord.findMany({
      where: {
        OR: [
          { description: { contains: '耐药菌' } },
          { description: { contains: 'MDRO' } },
          { description: { contains: '多重耐药' } },
          ...MDRO_BACTERIA.flatMap((b) =>
            b.keywords.map((kw) => ({ description: { contains: kw } }))
          ),
        ],
      },
      select: {
        id: true,
        patientName: true,
        dept: true,
        warningLevel: true,
        warningType: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // ========== 1. Overview Stats ==========
    const total = mdroCases.length;
    const thisMonth = mdroCases.filter(
      (c) => c.infectionDate >= thisMonthStart
    ).length;
    const activeAlerts = mdroWarnings.filter(
      (w) => w.status === '待处理'
    ).length;
    const affectedDepts = new Set(mdroCases.map((c) => c.dept)).size;

    // ========== 2. By Bacteria Type ==========
    const byBacteria = MDRO_BACTERIA.map((b) => {
      const cases = mdroCases.filter((c) =>
        b.keywords.some((kw) => c.pathogen?.includes(kw))
      );
      const count = cases.length;

      // Calculate trend: compare last 2 months
      const currentMonthCases = cases.filter(
        (c) => c.infectionDate >= thisMonthStart
      ).length;
      const prevMonthCases = cases.filter(
        (c) => c.infectionDate >= lastMonthStart && c.infectionDate < thisMonthStart
      ).length;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (currentMonthCases > prevMonthCases) trend = 'up';
      else if (currentMonthCases < prevMonthCases) trend = 'down';

      // Determine risk level based on count thresholds
      let risk = '低风险';
      if (count >= 15) risk = '高风险';
      else if (count >= 5) risk = '中风险';

      // Last detection date
      const lastCase = cases.sort((a, b) => b.infectionDate.getTime() - a.infectionDate.getTime())[0];
      const lastDetected = lastCase ? lastCase.infectionDate.toISOString().slice(0, 10) : '-';

      // Calculate trend percentage
      const trendPercent = prevMonthCases > 0
        ? parseFloat((((currentMonthCases - prevMonthCases) / prevMonthCases) * 100).toFixed(1))
        : currentMonthCases > 0 ? 100 : 0;

      return {
        name: b.name,
        fullName: b.fullName,
        count,
        trend,
        trendPercent,
        resistance: b.resistance,
        risk,
        lastDetected,
        color: b.color,
      };
    });

    // ========== 3. Department Distribution (with per-bacteria breakdown) ==========
    const deptBacteriaMap = new Map<string, Record<string, number>>();
    for (const c of mdroCases) {
      const dept = c.dept || '未知';
      if (!deptBacteriaMap.has(dept)) {
        deptBacteriaMap.set(dept, { CRAB: 0, CRKP: 0, MRSA: 0, VRE: 0, CRPA: 0 });
      }
      const bacteriaCounts = deptBacteriaMap.get(dept)!;
      for (const b of MDRO_BACTERIA) {
        if (b.keywords.some((kw) => c.pathogen?.includes(kw))) {
          bacteriaCounts[b.name] = (bacteriaCounts[b.name] || 0) + 1;
        }
      }
    }

    const deptDistribution = Array.from(deptBacteriaMap.entries())
      .map(([dept, bacteriaCounts]) => {
        const total_count = Object.values(bacteriaCounts).reduce((s, v) => s + v, 0);
        // Determine risk based on total count
        let risk = '低风险';
        if (total_count >= 10) risk = '高风险';
        else if (total_count >= 4) risk = '中风险';

        return {
          dept,
          count: total_count,
          crab: bacteriaCounts.CRAB,
          crkp: bacteriaCounts.CRKP,
          mrsa: bacteriaCounts.MRSA,
          vre: bacteriaCounts.VRE,
          crpa: bacteriaCounts.CRPA,
          risk,
        };
      })
      .sort((a, b) => b.count - a.count);

    // ========== 4. Monthly Trend (last 6 months) ==========
    const monthlyMap = new Map<string, number>();
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, 0);
    }
    for (const c of mdroCases) {
      const monthKey = c.infectionDate.toISOString().slice(0, 7);
      if (monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
      }
    }
    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // ========== 5. Recent Alerts ==========
    const recentAlerts = mdroWarnings.slice(0, 5).map((w) => {
      // Try to determine bacteria from description
      let bacteriaName = '未知';
      for (const b of MDRO_BACTERIA) {
        if (b.keywords.some((kw) => w.description.includes(kw))) {
          bacteriaName = b.fullName;
          break;
        }
      }
      return {
        id: w.id,
        bacteria: bacteriaName,
        patientName: w.patientName,
        dept: w.dept,
        warningLevel: w.warningLevel,
        warningType: w.warningType,
        description: w.description,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: { total, thisMonth, alerts: activeAlerts, departments: affectedDepts },
        byBacteria,
        deptDistribution,
        monthlyTrend,
        recentAlerts,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
