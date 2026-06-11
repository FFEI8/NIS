import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaginationParams } from '@/lib/api-utils';
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

export async function GET(request: Request) {
  try {
    const { skip, take, page, pageSize } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const where: any = {};

    if (searchParams.get('dept')) where.dept = searchParams.get('dept');
    if (searchParams.get('patientName')) where.patientName = { contains: searchParams.get('patientName') };
    if (searchParams.get('isAbnormal') !== null) where.isAbnormal = parseInt(searchParams.get('isAbnormal') || '0');
    if (searchParams.get('isFever') !== null) where.isFever = parseInt(searchParams.get('isFever') || '0');
    if (searchParams.get('feverLevel')) where.feverLevel = searchParams.get('feverLevel');
    if (searchParams.get('autoReported') !== null) where.autoReported = parseInt(searchParams.get('autoReported') || '0');
    if (searchParams.get('measureRoute')) where.measureRoute = searchParams.get('measureRoute');

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      where.measureTime = {};
      if (startDate) where.measureTime.gte = new Date(startDate);
      if (endDate) where.measureTime.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      db.temperatureRecord.findMany({ where, skip, take, orderBy: { measureTime: 'desc' } }),
      db.temperatureRecord.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Auto-calculate fever fields
    const temperature = parseFloat(body.temperature);
    const { isAbnormal, isFever, feverLevel } = calculateFeverLevel(temperature);

    const data = {
      ...body,
      temperature,
      isAbnormal,
      isFever,
      feverLevel,
    };

    // Create the temperature record
    const item = await db.temperatureRecord.create({ data });

    // If fever (>=38.0), auto-create SymptomSurveillance and WarningRecord
    if (isFever) {
      await processFeverAutoWarning({ ...data, measureTime: data.measureTime || new Date() }, item.id);
      // Re-fetch to include auto-report updates
      const updated = await db.temperatureRecord.findUnique({ where: { id: item.id } });
      return NextResponse.json({ success: true, data: updated }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
