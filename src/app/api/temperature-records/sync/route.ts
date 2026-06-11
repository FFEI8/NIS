import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateFeverLevel } from '@/lib/fever-utils';

// Process fever auto-warning: create SymptomSurveillance + WarningRecord
async function processFeverAutoWarning(record: any, createdId: string) {
  const { temperature, feverLevel, patientId, patientName, gender, age, dept, measureTime } = record;

  // Create SymptomSurveillance record
  const symptomRecord = await db.symptomSurveillance.create({
    data: {
      dept,
      patientId,
      patientName,
      gender: gender || null,
      age: age || null,
      temperature,
      symptomGroup: '发热',
      symptomDetail: `体温${temperature}℃，${feverLevel}，HIS体温监测自动上报`,
      onsetDate: new Date(measureTime),
      reporter: 'HIS系统自动',
      alertTriggered: 1,
      status: '待核实',
    },
  });

  // Create WarningRecord
  const warningRecord = await db.warningRecord.create({
    data: {
      patientId,
      patientName,
      dept,
      warningType: '病例预警',
      warningLevel: temperature >= 39.0 ? '高' : temperature >= 38.0 ? '中' : '低',
      description: `患者${patientName}(${dept})体温${temperature}℃，${feverLevel}，HIS体温监测自动上报`,
      status: '待处理',
    },
  });

  // Update temperature record with auto-report info
  await db.temperatureRecord.update({
    where: { id: createdId },
    data: {
      autoReported: 1,
      symptomSurveillanceId: symptomRecord.id,
      warningTriggered: 1,
      warningId: warningRecord.id,
    },
  });

  return { symptomRecord, warningRecord };
}

export async function POST(request: Request) {
  try {
    let records = [];
    try {
      const body = await request.json();
      if (Array.isArray(body) && body.length > 0) {
        records = body;
      }
    } catch {
      // No body provided, generate sample data
    }

    // If no records provided, generate realistic HIS data
    if (records.length === 0) {
      const depts = ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '感染科', '呼吸科'];
      const routes = ['腋下', '口腔', '耳温', '额温'];
      const sources = ['HIS自动推送', '护理录入', '设备采集'];
      const names = ['张明', '李华', '王强', '赵丽', '刘伟', '陈芳', '杨军', '黄秀', '周杰', '吴敏',
        '郑文', '冯武', '孙成', '朱康', '何德', '马建', '罗国', '梁安', '宋平', '谢辉'];
      const now = new Date();

      for (let i = 0; i < 30; i++) {
        // Generate temperature with realistic distribution
        let temp: number;
        const rand = Math.random();
        if (rand < 0.25) {
          temp = 36.0 + Math.random() * 1.2; // Normal: 36.0-37.2
        } else if (rand < 0.50) {
          temp = 37.3 + Math.random() * 0.6; // Low fever: 37.3-37.9
        } else if (rand < 0.78) {
          temp = 38.0 + Math.random() * 0.9; // Moderate: 38.0-38.9
        } else if (rand < 0.95) {
          temp = 39.0 + Math.random() * 1.0; // High: 39.0-39.9
        } else {
          temp = 40.0 + Math.random() * 1.5; // Very high: 40.0-41.5
        }
        temp = Math.round(temp * 10) / 10;

        const measureTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        records.push({
          patientId: `P${String(20240100 + i).padStart(8, '0')}`,
          patientName: names[i % names.length],
          gender: i % 3 === 0 ? '女' : '男',
          age: 20 + Math.floor(Math.random() * 60),
          dept: depts[i % depts.length],
          bedNo: `${depts[i % depts.length].charAt(0)}-${String((i % 15) + 1).padStart(2, '0')}`,
          visitId: `V${String(20240100 + i).padStart(8, '0')}`,
          temperature: temp,
          measureRoute: routes[i % routes.length],
          measureTime,
          nurseName: `护士${String(i % 5 + 1).padStart(2, '0')}`,
          hisSource: sources[i % sources.length],
        });
      }
    }

    // Process each record
    let syncedRecords = 0;
    let warningsTriggered = 0;

    for (const record of records) {
      const temperature = parseFloat(String(record.temperature));
      const { isAbnormal, isFever, feverLevel } = calculateFeverLevel(temperature);

      const data = {
        patientId: record.patientId || `P${String(Date.now()).slice(-8)}`,
        patientName: record.patientName || '未知',
        gender: record.gender || null,
        age: record.age || null,
        dept: record.dept || '内科',
        bedNo: record.bedNo || null,
        visitId: record.visitId || null,
        temperature,
        measureRoute: record.measureRoute || '腋下',
        measureTime: record.measureTime ? new Date(record.measureTime) : new Date(),
        nurseId: record.nurseId || null,
        nurseName: record.nurseName || null,
        hisSource: record.hisSource || 'HIS自动推送',
        isAbnormal,
        isFever,
        feverLevel,
        syncStatus: '已同步',
        syncTime: new Date(),
      };

      const created = await db.temperatureRecord.create({ data });
      syncedRecords++;

      // If fever (>=38.0), auto-create SymptomSurveillance and WarningRecord
      if (isFever) {
        await processFeverAutoWarning({ ...data, measureTime: data.measureTime }, created.id);
        warningsTriggered++;
      }
    }

    return NextResponse.json({
      success: true,
      syncedRecords,
      warningsTriggered,
      message: `成功从HIS护理系统同步 ${syncedRecords} 条体温记录，触发 ${warningsTriggered} 条预警`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
