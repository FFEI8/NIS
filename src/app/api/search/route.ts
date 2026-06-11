import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim() || query.trim().length < 1) {
      return NextResponse.json({ success: true, data: { patients: [], cases: [], warnings: [] } });
    }

    const keyword = query.trim();

    // Search patients across infection cases (unique patients)
    const infectionCases = await db.infectionCase.findMany({
      where: {
        OR: [
          { patientName: { contains: keyword } },
          { patientId: { contains: keyword } },
        ],
      },
      select: {
        id: true,
        patientId: true,
        patientName: true,
        dept: true,
        infectionSite: true,
        status: true,
        infectionDate: true,
      },
      take: 5,
    });

    // Search warning records
    const warnings = await db.warningRecord.findMany({
      where: {
        OR: [
          { patientName: { contains: keyword } },
          { patientId: { contains: keyword } },
          { description: { contains: keyword } },
          { dept: { contains: keyword } },
        ],
      },
      select: {
        id: true,
        patientId: true,
        patientName: true,
        dept: true,
        warningLevel: true,
        warningType: true,
        status: true,
        createdAt: true,
      },
      take: 5,
    });

    // Search infectious disease cases
    const infectiousCases = await db.infectiousDiseaseCase.findMany({
      where: {
        OR: [
          { patientName: { contains: keyword } },
          { patientId: { contains: keyword } },
          { diseaseName: { contains: keyword } },
          { dept: { contains: keyword } },
        ],
      },
      select: {
        id: true,
        patientId: true,
        patientName: true,
        dept: true,
        diseaseName: true,
        diseaseCategory: true,
        status: true,
        reportDate: true,
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        patients: infectionCases.map(c => ({
          id: c.id,
          patientId: c.patientId,
          patientName: c.patientName,
          dept: c.dept,
          infectionSite: c.infectionSite,
          status: c.status,
          date: c.infectionDate,
          type: 'infection-case' as const,
          label: `${c.patientName} - ${c.dept} - ${c.infectionSite}`,
        })),
        cases: infectiousCases.map(c => ({
          id: c.id,
          patientId: c.patientId,
          patientName: c.patientName,
          dept: c.dept,
          diseaseName: c.diseaseName,
          diseaseCategory: c.diseaseCategory,
          status: c.status,
          date: c.reportDate,
          type: 'infectious-disease-case' as const,
          label: `${c.patientName} - ${c.diseaseName} (${c.diseaseCategory})`,
        })),
        warnings: warnings.map(w => ({
          id: w.id,
          patientId: w.patientId,
          patientName: w.patientName,
          dept: w.dept,
          warningLevel: w.warningLevel,
          warningType: w.warningType,
          status: w.status,
          date: w.createdAt,
          type: 'infection-warning' as const,
          label: `${w.patientName} - ${w.dept} - ${w.warningType}`,
        })),
      },
    });
  } catch (error: any) {
    console.error('[search] Error:', error);
    return NextResponse.json(
      { success: false, message: '搜索失败' },
      { status: 500 }
    );
  }
}
