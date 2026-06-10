import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Total count
    const totalCount = await db.infectiousDiseaseLabResult.count();

    // Positive count
    const positiveCount = await db.infectiousDiseaseLabResult.count({
      where: { isPositive: 1 },
    });

    // Recent positive results (7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPositiveCount = await db.infectiousDiseaseLabResult.count({
      where: {
        isPositive: 1,
        reportTime: { gte: sevenDaysAgo },
      },
    });

    // By disease category
    const categoryBreakdown = await db.infectiousDiseaseLabResult.groupBy({
      by: ['diseaseCategory'],
      _count: { id: true },
      where: { diseaseCategory: { not: null } },
    });

    // Positive by disease category
    const positiveCategoryBreakdown = await db.infectiousDiseaseLabResult.groupBy({
      by: ['diseaseCategory'],
      _count: { id: true },
      where: { isPositive: 1, diseaseCategory: { not: null } },
    });

    // By disease name
    const diseaseBreakdown = await db.infectiousDiseaseLabResult.groupBy({
      by: ['diseaseName'],
      _count: { id: true },
      where: { diseaseName: { not: null } },
    });

    // Positive by disease name
    const positiveDiseaseBreakdown = await db.infectiousDiseaseLabResult.groupBy({
      by: ['diseaseName'],
      _count: { id: true },
      where: { isPositive: 1, diseaseName: { not: null } },
    });

    // By department
    const deptBreakdown = await db.infectiousDiseaseLabResult.groupBy({
      by: ['dept'],
      _count: { id: true },
      where: { dept: { not: null } },
    });

    // Positive by department
    const positiveDeptBreakdown = await db.infectiousDiseaseLabResult.groupBy({
      by: ['dept'],
      _count: { id: true },
      where: { isPositive: 1, dept: { not: null } },
    });

    // Merge category data
    const categoryMap = new Map<string, { total: number; positive: number }>();
    for (const c of categoryBreakdown) {
      const cat = c.diseaseCategory || '未分类';
      categoryMap.set(cat, { total: c._count.id, positive: 0 });
    }
    for (const c of positiveCategoryBreakdown) {
      const cat = c.diseaseCategory || '未分类';
      const entry = categoryMap.get(cat);
      if (entry) entry.positive = c._count.id;
    }

    // Merge disease data
    const diseaseMap = new Map<string, { total: number; positive: number }>();
    for (const d of diseaseBreakdown) {
      const name = d.diseaseName || '未知';
      diseaseMap.set(name, { total: d._count.id, positive: 0 });
    }
    for (const d of positiveDiseaseBreakdown) {
      const name = d.diseaseName || '未知';
      const entry = diseaseMap.get(name);
      if (entry) entry.positive = d._count.id;
    }

    // Merge department data
    const deptMap = new Map<string, { total: number; positive: number }>();
    for (const d of deptBreakdown) {
      const dept = d.dept || '未知科室';
      deptMap.set(dept, { total: d._count.id, positive: 0 });
    }
    for (const d of positiveDeptBreakdown) {
      const dept = d.dept || '未知科室';
      const entry = deptMap.get(dept);
      if (entry) entry.positive = d._count.id;
    }

    // Sync status breakdown
    const syncStatusBreakdown = await db.infectiousDiseaseLabResult.groupBy({
      by: ['syncStatus'],
      _count: { id: true },
    });

    // Warning triggered count
    const warningTriggeredCount = await db.infectiousDiseaseLabResult.count({
      where: { warningTriggered: 1 },
    });

    // Auto reported count
    const autoReportedCount = await db.infectiousDiseaseLabResult.count({
      where: { autoReported: 1 },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        positiveCount,
        recentPositiveCount,
        categoryBreakdown: Array.from(categoryMap.entries()).map(([category, counts]) => ({
          category,
          ...counts,
        })),
        diseaseBreakdown: Array.from(diseaseMap.entries()).map(([diseaseName, counts]) => ({
          diseaseName,
          ...counts,
        })),
        deptBreakdown: Array.from(deptMap.entries()).map(([dept, counts]) => ({
          dept,
          ...counts,
        })),
        syncStatusBreakdown: syncStatusBreakdown.map(s => ({
          syncStatus: s.syncStatus,
          count: s._count.id,
        })),
        warningTriggeredCount,
        autoReportedCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
