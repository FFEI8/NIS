import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Case counts by category (甲类/乙类/丙类/其他)
    const casesByCategory = await db.infectiousDiseaseCase.groupBy({
      by: ['diseaseCategory'],
      _count: { id: true },
    });

    // Case counts by disease name (top 10)
    const casesByDisease = await db.infectiousDiseaseCase.groupBy({
      by: ['diseaseName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Case counts by department
    const casesByDept = await db.infectiousDiseaseCase.groupBy({
      by: ['dept'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Case counts by month (last 12 months)
    const allCases = await db.infectiousDiseaseCase.findMany({
      select: { diagnosisDate: true },
      orderBy: { diagnosisDate: 'desc' },
    });
    const casesByMonth: Record<string, number> = {};
    for (const c of allCases) {
      const monthKey = c.diagnosisDate.toISOString().slice(0, 7); // YYYY-MM
      casesByMonth[monthKey] = (casesByMonth[monthKey] || 0) + 1;
    }
    // Sort by month and take last 12
    const monthlyTrend = Object.entries(casesByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));

    // Case counts by status
    const casesByStatus = await db.infectiousDiseaseCase.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Case counts by severity
    const casesBySeverity = await db.infectiousDiseaseCase.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    // Alert statistics
    const alertsByLevel = await db.diseaseAlert.groupBy({
      by: ['alertLevel'],
      _count: { id: true },
    });

    const alertsByType = await db.diseaseAlert.groupBy({
      by: ['alertType'],
      _count: { id: true },
    });

    const alertsByStatus = await db.diseaseAlert.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const totalAlerts = await db.diseaseAlert.count();
    const pendingAlerts = await db.diseaseAlert.count({ where: { status: '待处理' } });

    // Contact tracing statistics
    const contactsByFollowUpStatus = await db.contactTracing.groupBy({
      by: ['followUpStatus'],
      _count: { id: true },
    });

    const contactsByContactType = await db.contactTracing.groupBy({
      by: ['contactType'],
      _count: { id: true },
    });

    const contactsByExposureLevel = await db.contactTracing.groupBy({
      by: ['exposureLevel'],
      _count: { id: true },
    });

    const totalContacts = await db.contactTracing.count();
    const confirmedContacts = await db.contactTracing.count({ where: { status: '已确认' } });
    const convertedContacts = await db.contactTracing.count({ where: { followUpStatus: '已转确诊' } });

    // Symptom surveillance statistics
    const symptomByGroup = await db.symptomSurveillance.groupBy({
      by: ['symptomGroup'],
      _count: { id: true },
    });

    const totalSurveillance = await db.symptomSurveillance.count();
    const clusteredCount = await db.symptomSurveillance.count({ where: { isClustered: 1 } });
    const alertedCount = await db.symptomSurveillance.count({ where: { alertTriggered: 1 } });

    // Total case counts
    const totalCases = await db.infectiousDiseaseCase.count();
    const pendingReviewCases = await db.infectiousDiseaseCase.count({ where: { status: '待审核' } });
    const reportedToCDC = await db.infectiousDiseaseCase.count({ where: { reportToCDC: 1 } });

    return NextResponse.json({
      success: true,
      data: {
        // Overview
        overview: {
          totalCases,
          pendingReviewCases,
          reportedToCDC,
          totalAlerts,
          pendingAlerts,
          totalContacts,
          confirmedContacts,
          convertedContacts,
          totalSurveillance,
          clusteredCount,
          alertedCount,
        },
        // Case breakdowns
        casesByCategory: casesByCategory.map((item) => ({
          category: item.diseaseCategory,
          count: item._count.id,
        })),
        casesByDisease: casesByDisease.map((item) => ({
          diseaseName: item.diseaseName,
          count: item._count.id,
        })),
        casesByDept: casesByDept.map((item) => ({
          dept: item.dept,
          count: item._count.id,
        })),
        casesByStatus: casesByStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        casesBySeverity: casesBySeverity.map((item) => ({
          severity: item.severity,
          count: item._count.id,
        })),
        monthlyTrend,
        // Alert breakdowns
        alertsByLevel: alertsByLevel.map((item) => ({
          level: item.alertLevel,
          count: item._count.id,
        })),
        alertsByType: alertsByType.map((item) => ({
          type: item.alertType,
          count: item._count.id,
        })),
        alertsByStatus: alertsByStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        // Contact tracing breakdowns
        contactsByFollowUpStatus: contactsByFollowUpStatus.map((item) => ({
          followUpStatus: item.followUpStatus,
          count: item._count.id,
        })),
        contactsByContactType: contactsByContactType.map((item) => ({
          contactType: item.contactType,
          count: item._count.id,
        })),
        contactsByExposureLevel: contactsByExposureLevel.map((item) => ({
          exposureLevel: item.exposureLevel,
          count: item._count.id,
        })),
        // Symptom surveillance breakdowns
        symptomByGroup: symptomByGroup.map((item) => ({
          symptomGroup: item.symptomGroup,
          count: item._count.id,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
