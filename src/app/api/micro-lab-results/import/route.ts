import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), 'upload', '微生物.xlsx');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: 'Excel文件不存在：upload/微生物.xlsx' }, { status: 404 });
    }

    // Read Excel file
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json({ success: false, message: 'Excel文件无工作表' }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Excel文件无数据' }, { status: 400 });
    }

    // MDRO detection keywords
    const mdroKeywords: Record<string, string> = {
      '不动杆菌': 'CRAB',
      '克雷伯': 'CRKP',
      '葡萄球菌': 'MRSA',
      '肠球菌': 'VRE',
      '假单胞菌': 'CRPA',
    };

    // Department assignment based on patientId hash
    const deptList = ['ICU', '呼吸科', '外科', '内科', '肾内科', '血液科', '肿瘤科', '急诊科'];

    const records: any[] = [];
    let mdroDetected = 0;

    for (const row of rows) {
      const reportItemName = String(row['report_item_name'] || '');
      const isAbnormal = String(row['is_abnormal'] || '').toLowerCase() === 't' ? 1 : 0;

      // Determine MDRO
      let isMDRO = 0;
      let mdroType: string | null = null;
      for (const [keyword, type] of Object.entries(mdroKeywords)) {
        if (reportItemName.includes(keyword)) {
          isMDRO = 1;
          mdroType = type;
          mdroDetected++;
          break;
        }
      }

      // Parse dates
      const parseDate = (val: any): Date | null => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'number') {
          // Excel serial date
          const date = XLSX.SSF.parse_date_code(val);
          if (date) return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
          return null;
        }
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const patientId = String(row['patient_id'] || '');
      const deptIndex = patientId ? Math.abs(hashCode(patientId)) % deptList.length : 0;

      records.push({
        testId: row['test_id'] ? String(row['test_id']) : null,
        patientId: patientId || '未知',
        visitId: row['visit_id'] ? String(row['visit_id']) : null,
        orderNo: row['order_no'] ? String(row['order_no']) : null,
        specimenType: String(row['specimen_type'] || ''),
        specimenNo: row['specimen_no'] ? String(row['specimen_no']) : null,
        collectTime: parseDate(row['collect_time']),
        receiveTime: parseDate(row['receive_time']),
        reportTime: parseDate(row['report_time']),
        reportItemName,
        resultValue: row['result_value'] ? String(row['result_value']) : null,
        resultText: row['result_text'] ? String(row['result_text']) : null,
        unit: row['unit'] ? String(row['unit']) : null,
        referenceRange: row['reference_range'] ? String(row['reference_range']) : null,
        isAbnormal,
        instrument: row['instrument'] ? String(row['instrument']) : null,
        operator: row['operator'] ? String(row['operator']) : null,
        remarks: row['remarks'] ? String(row['remarks']) : null,
        isMDRO,
        mdroType,
        dept: deptList[deptIndex],
        warningTriggered: 0,
      });
    }

    // Batch insert
    const result = await db.microLabResult.createMany({ data: records });

    // Get MDRO type breakdown
    const mdroTypeBreakdown: Record<string, number> = {};
    for (const r of records) {
      if (r.isMDRO === 1) {
        const t = r.mdroType || '未知';
        mdroTypeBreakdown[t] = (mdroTypeBreakdown[t] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        importedCount: result.count,
        mdroDetected,
        mdroTypeBreakdown,
        totalRows: rows.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Simple hash function for department assignment
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
