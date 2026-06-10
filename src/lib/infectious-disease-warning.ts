import { db } from '@/lib/db';

interface LabResultData {
  patientId: string;
  patientName?: string | null;
  gender?: string | null;
  age?: number | null;
  dept?: string | null;
  testItemName: string;
  resultValue?: string | null;
  reportTime?: Date | null;
  operator?: string | null;
}

interface TestItemInfo {
  testItemCode: string;
  testItemName: string;
  diseaseName: string;
  diseaseCategory: string;
  isNotifiable: number;
  reportTimeLimit?: number | null;
  positiveResult: string;
}

/**
 * Shared auto-warning logic for infectious disease positive lab results.
 * When isPositive=1, this function:
 * 1. Creates a WarningRecord
 * 2. Creates a DiseaseAlert (if isNotifiable=1)
 * 3. Creates an InfectiousDiseaseCase (if isNotifiable=1 and not already reported)
 * 4. Returns the IDs of created records
 */
export async function triggerInfectiousDiseaseWarning(
  labResult: LabResultData,
  testItem: TestItemInfo,
  labResultId: string
): Promise<{
  warningRecordId?: string;
  diseaseAlertId?: string;
  infectiousDiseaseCaseId?: string;
  warningTriggered: boolean;
  autoReported: boolean;
}> {
  const { patientId, patientName, gender, age, dept, testItemName, resultValue, reportTime, operator } = labResult;
  const { diseaseName, diseaseCategory, isNotifiable } = testItem;

  const result: {
    warningRecordId?: string;
    diseaseAlertId?: string;
    infectiousDiseaseCaseId?: string;
    warningTriggered: boolean;
    autoReported: boolean;
  } = { warningTriggered: false, autoReported: false };

  // 1. Create WarningRecord
  const warningType = diseaseCategory === '甲类' ? '暴发预警' : '病例预警';
  const warningLevel = diseaseCategory === '甲类' ? '高' : diseaseCategory === '乙类' ? '中' : '低';

  const warningRecord = await db.warningRecord.create({
    data: {
      patientId,
      patientName: patientName || '未知',
      dept: dept || '未知科室',
      warningType,
      warningLevel,
      description: `${testItemName}阳性检出 - 关联${diseaseName}(${diseaseCategory})`,
      status: '待处理',
    },
  });
  result.warningRecordId = warningRecord.id;
  result.warningTriggered = true;

  // 2. Create DiseaseAlert (only if isNotifiable=1)
  if (isNotifiable === 1) {
    const alertLevel = diseaseCategory === '甲类' ? '红色' : diseaseCategory === '乙类' ? '橙色' : '黄色';

    let suggestion: string;
    if (diseaseCategory === '甲类') {
      suggestion = '1.立即隔离管理；2.2小时内网络直报；3.追踪接触者；4.环境消毒';
    } else if (diseaseCategory === '乙类') {
      suggestion = '1.隔离管理；2.24小时内网络直报；3.追踪接触者';
    } else {
      suggestion = '1.对症治疗；2.24小时内报告；3.关注聚集性';
    }

    const diseaseAlert = await db.diseaseAlert.create({
      data: {
        alertType: '法定传染病预警',
        alertLevel,
        diseaseName,
        alertSource: '系统自动',
        triggerRule: `${diseaseCategory}传染病阳性检出自动预警`,
        affectedDept: dept || '未知科室',
        affectedCount: 1,
        description: `检出${diseaseName}阳性病例（${testItemName}），需按${diseaseCategory}传染病管理要求处理`,
        suggestion,
        status: '待处理',
      },
    });
    result.diseaseAlertId = diseaseAlert.id;

    // 3. Create InfectiousDiseaseCase (only if isNotifiable=1)
    // Check if there is already an unreported case for this patient with the same disease
    const existingCase = await db.infectiousDiseaseCase.findFirst({
      where: {
        patientId,
        diseaseName,
        status: { in: ['待审核', '已审核'] },
      },
    });

    if (!existingCase) {
      const infectiousDiseaseCase = await db.infectiousDiseaseCase.create({
        data: {
          patientId,
          patientName: patientName || '未知',
          gender: gender || '未知',
          age: age || 0,
          dept: dept || '未知科室',
          diseaseName,
          diseaseCategory,
          diagnosisDate: reportTime || new Date(),
          reportType: '初次报告',
          severity: '普通',
          reporter: operator || '系统自动',
          status: '待审核',
          labResult: `${testItemName}: ${resultValue || '阳性'}`,
        },
      });
      result.infectiousDiseaseCaseId = infectiousDiseaseCase.id;
    }

    result.autoReported = true;
  }

  // 4. Update the lab result with warning/alert info
  await db.infectiousDiseaseLabResult.update({
    where: { id: labResultId },
    data: {
      warningTriggered: 1,
      warningId: result.warningRecordId,
      diseaseAlertId: result.diseaseAlertId,
      autoReported: result.autoReported ? 1 : 0,
      infectiousDiseaseCaseId: result.infectiousDiseaseCaseId,
    },
  });

  return result;
}

/**
 * Auto-populate disease info from InfectiousDiseaseTestItem
 */
export async function lookupTestItemInfo(testItemCode: string): Promise<TestItemInfo | null> {
  const testItem = await db.infectiousDiseaseTestItem.findUnique({
    where: { testItemCode },
  });
  if (!testItem) return null;
  return {
    testItemCode: testItem.testItemCode,
    testItemName: testItem.testItemName,
    diseaseName: testItem.diseaseName,
    diseaseCategory: testItem.diseaseCategory,
    isNotifiable: testItem.isNotifiable,
    reportTimeLimit: testItem.reportTimeLimit,
    positiveResult: testItem.positiveResult,
  };
}

/**
 * Check if a result value indicates a positive result
 * by comparing against the positiveResult field in the test item
 */
export function isResultPositive(resultValue: string | null | undefined, positiveResult: string): boolean {
  if (!resultValue || !positiveResult) return false;
  // positiveResult can be comma-separated values (e.g., "阳性,HIV感染待确定")
  const positiveValues = positiveResult.split(',').map(v => v.trim());
  return positiveValues.some(pv => resultValue.includes(pv));
}
