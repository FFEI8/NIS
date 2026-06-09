import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Real statistics from database
    const [totalRecords, feverCount, abnormalCount, reportedCount] = await Promise.all([
      db.temperatureRecord.count(),
      db.temperatureRecord.count({ where: { isFever: 1 } }),
      db.temperatureRecord.count({ where: { isAbnormal: 1 } }),
      db.temperatureRecord.count({ where: { autoReported: 1 } }),
    ]);

    // 7-day trend data
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentRecords = await db.temperatureRecord.findMany({
      where: { measureTime: { gte: sevenDaysAgo } },
      orderBy: { measureTime: 'desc' },
    });

    const trend: Array<{ date: string; avgTemp: number; maxTemp: number; feverCount: number }> = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayRecords = recentRecords.filter(r => {
        const mt = new Date(r.measureTime);
        return mt >= dayStart && mt < dayEnd;
      });
      const avgTemp = dayRecords.length > 0
        ? Math.round((dayRecords.reduce((s, r) => s + r.temperature, 0) / dayRecords.length) * 10) / 10
        : 36.5;
      const maxTemp = dayRecords.length > 0
        ? Math.round(Math.max(...dayRecords.map(r => r.temperature)) * 10) / 10
        : 36.5;
      const dayFeverCount = dayRecords.filter(r => r.isFever === 1).length;
      trend.push({ date: dateStr, avgTemp, maxTemp, feverCount: dayFeverCount });
    }

    // Department breakdown
    const deptBreakdown = await db.temperatureRecord.groupBy({
      by: ['dept'],
      _count: { id: true },
    });

    const deptFeverCounts = await db.temperatureRecord.groupBy({
      by: ['dept'],
      _count: { id: true },
      where: { isFever: 1 },
    });

    const deptAbnormalCounts = await db.temperatureRecord.groupBy({
      by: ['dept'],
      _count: { id: true },
      where: { isAbnormal: 1 },
    });

    const deptMap = new Map<string, { total: number; fever: number; abnormal: number }>();
    for (const d of deptBreakdown) {
      deptMap.set(d.dept, { total: d._count.id, fever: 0, abnormal: 0 });
    }
    for (const d of deptFeverCounts) {
      const entry = deptMap.get(d.dept);
      if (entry) entry.fever = d._count.id;
    }
    for (const d of deptAbnormalCounts) {
      const entry = deptMap.get(d.dept);
      if (entry) entry.abnormal = d._count.id;
    }

    const deptStats = Array.from(deptMap.entries()).map(([dept, counts]) => ({
      dept,
      ...counts,
    }));

    // Fever level breakdown
    const feverLevelBreakdown = await db.temperatureRecord.groupBy({
      by: ['feverLevel'],
      _count: { id: true },
    });

    // Measure route breakdown
    const measureRouteBreakdown = await db.temperatureRecord.groupBy({
      by: ['measureRoute'],
      _count: { id: true },
    });

    // Recent records for table display
    const records = await db.temperatureRecord.findMany({
      orderBy: { measureTime: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      totalRecords,
      feverCount,
      abnormalCount,
      reportedCount,
      trend,
      deptBreakdown: deptStats,
      feverLevelBreakdown: feverLevelBreakdown.map(f => ({ feverLevel: f.feverLevel, count: f._count.id })),
      measureRouteBreakdown: measureRouteBreakdown.map(m => ({ measureRoute: m.measureRoute, count: m._count.id })),
      records: records.map(r => ({
        id: r.id,
        patientId: r.patientId,
        patientName: r.patientName,
        dept: r.dept,
        bedNo: r.bedNo,
        temperature: r.temperature,
        measureRoute: r.measureRoute,
        measureTime: r.measureTime,
        isAbnormal: r.isAbnormal === 1,
        isFever: r.isFever === 1,
        isReported: r.autoReported === 1,
        dataSource: r.hisSource,
        feverLevel: r.feverLevel,
        autoReported: r.autoReported,
        warningTriggered: r.warningTriggered,
        symptomSurveillanceId: r.symptomSurveillanceId,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
