import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lookupTestItemInfo, isResultPositive, triggerInfectiousDiseaseWarning } from '@/lib/infectious-disease-warning';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.infectiousDiseaseLabResult.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, message: '记录不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Re-evaluate positive status if testItemCode or resultValue changed
    if (body.testItemCode || body.resultValue) {
      // Get existing record to merge fields
      const existing = await db.infectiousDiseaseLabResult.findUnique({ where: { id } });
      if (existing) {
        const effectiveTestItemCode = body.testItemCode || existing.testItemCode;
        const effectiveResultValue = body.resultValue !== undefined ? body.resultValue : existing.resultValue;

        const testItemInfo = await lookupTestItemInfo(effectiveTestItemCode);
        if (testItemInfo) {
          // Update disease info from test item
          body.diseaseName = testItemInfo.diseaseName;
          body.diseaseCategory = testItemInfo.diseaseCategory;
          body.isNotifiable = testItemInfo.isNotifiable;
          body.reportTimeLimit = testItemInfo.reportTimeLimit;

          // Re-detect positive status
          if (effectiveResultValue) {
            const detected = isResultPositive(effectiveResultValue, testItemInfo.positiveResult);
            if (detected) {
              body.isPositive = 1;
              body.isAbnormal = 1;
            } else {
              // If result changed from positive to negative, update accordingly
              if (existing.isPositive === 1) {
                body.isPositive = 0;
                body.isAbnormal = 0;
              }
            }
          }
        }
      }
    }

    const item = await db.infectiousDiseaseLabResult.update({ where: { id }, data: body });

    // If isPositive changed to 1 and warning not yet triggered, auto-trigger warning logic
    if (item.isPositive === 1 && item.warningTriggered === 0) {
      const testItemInfo = await lookupTestItemInfo(item.testItemCode);
      if (testItemInfo) {
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

        // Re-fetch to get updated warning fields
        const updatedItem = await db.infectiousDiseaseLabResult.findUnique({ where: { id } });
        return NextResponse.json({ success: true, data: updatedItem });
      }
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.infectiousDiseaseLabResult.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
