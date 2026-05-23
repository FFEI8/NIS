import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module') || 'infection-cases';

    let data: any[] = [];
    let headers: string[] = [];

    switch (moduleName) {
      case 'infection-cases': {
        data = await db.infectionCase.findMany({ take: 1000 });
        headers = ['患者ID', '患者姓名', '性别', '年龄', '科室', '感染部位', '病原体', '感染日期', '状态'];
        data = data.map(d => [d.patientId, d.patientName, d.gender, d.age, d.dept, d.infectionSite, d.pathogen || '', d.infectionDate?.toString().slice(0, 10) || '', d.status]);
        break;
      }
      case 'warnings': {
        data = await db.warningRecord.findMany({ take: 1000 });
        headers = ['患者ID', '患者姓名', '科室', '预警类型', '预警级别', '描述', '状态'];
        data = data.map(d => [d.patientId, d.patientName, d.dept, d.warningType, d.warningLevel, d.description, d.status]);
        break;
      }
      case 'environmental-monitors': {
        data = await db.environmentalMonitor.findMany({ take: 1000 });
        headers = ['科室', '采样点', '采样类型', '采样日期', '菌落数', '结果', '审核状态'];
        data = data.map(d => [d.dept, d.samplePoint, d.sampleType, d.sampleDate?.toString().slice(0, 10) || '', d.colonyCount?.toString() || '', d.result || '', d.reviewStatus]);
        break;
      }
      case 'occupational-exposures': {
        data = await db.occupationalExposure.findMany({ take: 1000 });
        headers = ['员工姓名', '科室', '暴露类型', '暴露部位', '暴露日期', '风险级别', '状态'];
        data = data.map(d => [d.staffName, d.staffDept, d.exposureType, d.exposurePart, d.exposureDate?.toString().slice(0, 10) || '', d.riskLevel || '', d.status]);
        break;
      }
      case 'hand-hygienes': {
        data = await db.handHygiene.findMany({ take: 1000 });
        headers = ['科室', '月份', '总机会数', '依从次数', '依从率'];
        data = data.map(d => [d.dept, d.month, d.totalOpportunities.toString(), d.compliantActions.toString(), d.complianceRate.toString() + '%']);
        break;
      }
      case 'antibiotic-usages': {
        data = await db.antibioticUsage.findMany({ take: 1000 });
        headers = ['科室', '月份', '总患者数', '抗菌药物患者数', '使用率'];
        data = data.map(d => [d.dept, d.month, d.totalPatients.toString(), d.antibioticPatients.toString(), d.usageRate.toString() + '%']);
        break;
      }
      default: {
        return NextResponse.json({ success: false, message: '不支持的导出模块' }, { status: 400 });
      }
    }

    // Generate CSV
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const csvContent = BOM + [
      headers.join(','),
      ...data.map(row => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${moduleName}-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
