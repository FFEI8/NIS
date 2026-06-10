import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';
import { lookupTestItemInfo, isResultPositive, triggerInfectiousDiseaseWarning } from '@/lib/infectious-disease-warning';

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};

    if (searchParams.get('isPositive') !== null) {
      where.isPositive = parseInt(searchParams.get('isPositive') || '0');
    }
    if (searchParams.get('diseaseName')) {
      where.diseaseName = { contains: searchParams.get('diseaseName') };
    }
    if (searchParams.get('diseaseCategory')) {
      where.diseaseCategory = searchParams.get('diseaseCategory');
    }
    if (searchParams.get('testItemCode')) {
      where.testItemCode = searchParams.get('testItemCode');
    }
    if (searchParams.get('dept')) {
      where.dept = searchParams.get('dept');
    }
    if (searchParams.get('status')) {
      where.status = searchParams.get('status');
    }
    if (searchParams.get('syncStatus')) {
      where.syncStatus = searchParams.get('syncStatus');
    }
    if (searchParams.get('keyword')) {
      const kw = searchParams.get('keyword');
      where.OR = [
        { patientId: { contains: kw } },
        { patientName: { contains: kw } },
        { testItemName: { contains: kw } },
      ];
    }

    const [items, total] = await Promise.all([
      db.infectiousDiseaseLabResult.findMany({ where, skip, take, orderBy: { reportTime: 'desc' } }),
      db.infectiousDiseaseLabResult.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Auto-populate disease info from InfectiousDiseaseTestItem if testItemCode is provided
    let testItemInfo = null;
    if (body.testItemCode) {
      testItemInfo = await lookupTestItemInfo(body.testItemCode);
      if (testItemInfo) {
        body.diseaseName = testItemInfo.diseaseName;
        body.diseaseCategory = testItemInfo.diseaseCategory;
        body.isNotifiable = testItemInfo.isNotifiable;
        body.reportTimeLimit = testItemInfo.reportTimeLimit;
        // Auto-fill testItemName if not provided
        if (!body.testItemName) {
          body.testItemName = testItemInfo.testItemName;
        }
      }
    }

    // Auto-detect positive result: check if resultValue matches positiveResult
    if (testItemInfo && body.resultValue) {
      const detected = isResultPositive(body.resultValue, testItemInfo.positiveResult);
      if (detected) {
        body.isPositive = 1;
        body.isAbnormal = 1;
      }
    }

    // Create the lab result first
    const item = await db.infectiousDiseaseLabResult.create({ data: body });

    // If isPositive=1, auto-trigger warning logic
    if (item.isPositive === 1 && testItemInfo) {
      await triggerInfectiousDiseaseWarning(
        {
          patientId: item.patientId,
          patientName: item.patientName,
          gender: item.gender,
          age: item.age,
          dept: item.dept,
          testItemName: item.testItemName,
          resultValue: item.resultValue,
          reportTime: item.reportTime,
          operator: item.operator,
        },
        testItemInfo,
        item.id
      );

      // Re-fetch the item to get updated warning fields
      const updatedItem = await db.infectiousDiseaseLabResult.findUnique({ where: { id: item.id } });
      return NextResponse.json({ success: true, data: updatedItem }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
