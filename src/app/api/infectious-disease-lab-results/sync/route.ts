import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lookupTestItemInfo, isResultPositive, triggerInfectiousDiseaseWarning } from '@/lib/infectious-disease-warning';

// Generate sample HIS data for testing
function generateSampleHISData() {
  const depts = ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '感染科', '呼吸科'];
  const names = ['张明', '李华', '王强', '赵丽', '刘伟', '陈芳', '杨军', '黄秀', '周杰', '吴敏',
    '郑文', '冯武', '孙成', '朱康', '何德', '马建', '罗国', '梁安', '宋平', '谢辉'];
  const specimenTypes = ['血清', '全血', '咽拭子', '痰液', '粪便', '尿液', '脑脊液'];
  const hisTestCodes = ['HIS_HBV', 'HIS_HCV', 'HIS_HIV', 'HIS_TP', 'HIS_COVID', 'HIS_INFLUENZA'];
  const hisTestNames = ['乙型肝炎病毒检测', '丙型肝炎病毒检测', '人类免疫缺陷病毒检测', '梅毒螺旋体检测', '新型冠状病毒核酸检测', '流行性感冒病毒检测'];
  const resultValues = ['阳性', '阴性', '阳性', '阴性', '阴性', '阳性', '阴性', '阴性'];
  const now = new Date();

  const records = [];
  for (let i = 0; i < 20; i++) {
    const testIndex = i % hisTestCodes.length;
    const measureTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    records.push({
      hisTestCode: hisTestCodes[testIndex],
      hisTestName: hisTestNames[testIndex],
      subItemNo: 1,
      patientId: `P${String(20240100 + i).padStart(8, '0')}`,
      patientName: names[i % names.length],
      gender: i % 3 === 0 ? '女' : '男',
      age: 20 + Math.floor(Math.random() * 60),
      dept: depts[i % depts.length],
      bedNo: `${depts[i % depts.length].charAt(0)}-${String((i % 15) + 1).padStart(2, '0')}`,
      visitId: `V${String(20240100 + i).padStart(8, '0')}`,
      specimenType: specimenTypes[i % specimenTypes.length],
      resultValue: resultValues[i % resultValues.length],
      collectTime: new Date(measureTime.getTime() - 2 * 60 * 60 * 1000),
      receiveTime: new Date(measureTime.getTime() - 1 * 60 * 60 * 1000),
      reportTime: measureTime,
      operator: `检验师${String(i % 5 + 1).padStart(2, '0')}`,
    });
  }
  return records;
}

export async function POST(request: Request) {
  try {
    let records: any[] = [];
    try {
      const body = await request.json();
      if (body.records && Array.isArray(body.records) && body.records.length > 0) {
        records = body.records;
      }
    } catch {
      // No body provided, generate sample data
    }

    // If no records provided, generate sample HIS data
    if (records.length === 0) {
      records = generateSampleHISData();
    }

    // Process each record
    let synced = 0;
    let positive = 0;
    let warningsTriggered = 0;
    let casesCreated = 0;

    for (const record of records) {
      // Step 1: Map HIS test codes to system test items
      const mapping = await db.hisInfectiousDiseaseTestMapping.findFirst({
        where: {
          hisTestCode: record.hisTestCode,
          subItemNo: record.subItemNo || 1,
          status: 1,
        },
      });

      if (!mapping) {
        // Skip records without mapping - they cannot be processed
        continue;
      }

      // Step 2: Look up test item info
      const testItemInfo = await lookupTestItemInfo(mapping.testItemCode);
      if (!testItemInfo) {
        continue;
      }

      // Step 3: Create InfectiousDiseaseLabResult with mapped fields
      const resultValue = record.resultValue || '';
      const detectedPositive = isResultPositive(resultValue, testItemInfo.positiveResult);

      const labData: any = {
        testId: record.testId || null,
        patientId: record.patientId || `P${String(Date.now()).slice(-8)}`,
        patientName: record.patientName || '未知',
        gender: record.gender || null,
        age: record.age || null,
        visitId: record.visitId || null,
        orderNo: record.orderNo || null,
        dept: record.dept || '内科',
        bedNo: record.bedNo || null,
        specimenType: record.specimenType || null,
        specimenNo: record.specimenNo || null,
        collectTime: record.collectTime ? new Date(record.collectTime) : null,
        receiveTime: record.receiveTime ? new Date(record.receiveTime) : null,
        reportTime: record.reportTime ? new Date(record.reportTime) : new Date(),
        testItemCode: mapping.testItemCode,
        testItemName: mapping.testItemName || testItemInfo.testItemName,
        resultValue,
        resultText: record.resultText || null,
        unit: record.unit || null,
        referenceRange: record.referenceRange || null,
        isAbnormal: detectedPositive ? 1 : 0,
        isPositive: detectedPositive ? 1 : 0,
        diseaseName: testItemInfo.diseaseName,
        diseaseCategory: testItemInfo.diseaseCategory,
        isNotifiable: testItemInfo.isNotifiable,
        reportTimeLimit: testItemInfo.reportTimeLimit,
        hisTestCode: record.hisTestCode,
        hisTestName: record.hisTestName || mapping.hisTestName,
        hisSubItemNo: record.subItemNo || mapping.subItemNo,
        hisSource: record.hisSource || 'HIS自动推送',
        instrument: record.instrument || null,
        operator: record.operator || null,
        reviewer: record.reviewer || null,
        remarks: record.remarks || null,
        status: '已审核',
        syncStatus: '已同步',
        syncTime: new Date(),
      };

      const created = await db.infectiousDiseaseLabResult.create({ data: labData });
      synced++;

      // Step 4: Auto-detect positive results and trigger warnings
      if (detectedPositive) {
        positive++;
        const result = await triggerInfectiousDiseaseWarning(
          {
            patientId: created.patientId,
            patientName: created.patientName,
            gender: created.gender,
            age: created.age,
            dept: created.dept,
            testItemName: created.testItemName,
            resultValue: created.resultValue,
            reportTime: created.reportTime,
            operator: created.operator,
          },
          testItemInfo,
          created.id
        );
        if (result.warningTriggered) warningsTriggered++;
        if (result.infectiousDiseaseCaseId) casesCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { synced, positive, warningsTriggered, casesCreated },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
