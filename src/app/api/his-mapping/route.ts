import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Query all 5 HIS mapping tables
    const [
      businessScenarios,
      fieldMappingsRaw,
      conversionRules,
      validationRules,
      consistencyIssues,
    ] = await Promise.all([
      db.hisBusinessScenario.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      db.hisFieldMapping.findMany({ where: { status: 1 }, orderBy: [{ scenarioId: 'asc' }, { sort: 'asc' }] }),
      db.hisConversionRule.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      db.hisValidationRule.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
      db.hisConsistencyIssue.findMany({ where: { status: 1 }, orderBy: { sort: 'asc' } }),
    ]);

    // Group field mappings by scenarioId
    const fieldMappings: Record<string, Array<{
      id: string;
      systemField: string;
      systemLabel: string;
      dataType: string;
      length: number;
      required: boolean;
      hisField: string;
      hisTable: string;
      transformRule: string;
      specialLogic: string;
      validationRule: string;
      consistencyRisk: string;
    }>> = {};

    for (const fm of fieldMappingsRaw) {
      if (!fieldMappings[fm.scenarioId]) {
        fieldMappings[fm.scenarioId] = [];
      }
      fieldMappings[fm.scenarioId].push({
        id: fm.id,
        systemField: fm.systemField,
        systemLabel: fm.systemLabel,
        dataType: fm.dataType,
        length: fm.length,
        required: fm.required === 1,
        hisField: fm.hisField ?? '',
        hisTable: fm.hisTable ?? '',
        transformRule: fm.transformRule ?? '',
        specialLogic: fm.specialLogic ?? '',
        validationRule: fm.validationRule ?? '',
        consistencyRisk: fm.consistencyRisk ?? '',
      });
    }

    // Map business scenarios to match frontend structure
    const scenarios = businessScenarios.map(s => ({
      id: s.scenarioId,
      name: s.name,
      module: s.module,
      hisSystem: s.hisSystem,
      priority: s.priority,
      description: s.description ?? '',
    }));

    // Map conversion rules
    const convRules = conversionRules.map(r => ({
      category: r.category,
      sourceFormat: r.sourceFormat,
      targetFormat: r.targetFormat,
      conversionFunction: r.conversionFunction ?? '',
      example: r.example ?? '',
    }));

    // Map validation rules
    const valRules = validationRules.map(r => ({
      form: r.form,
      field: r.field,
      ruleType: r.ruleType,
      ruleDescription: r.ruleDescription,
      errorMessage: r.errorMessage,
      severity: r.severity,
    }));

    // Map consistency issues
    const consIssues = consistencyIssues.map(i => ({
      severity: i.severity,
      category: i.issueType,
      description: i.description,
      affectedFields: i.field,
      solution: i.suggestion ?? '',
    }));

    // Fetch temperature stats directly from DB (instead of fetching from localhost)
    let temperatureStats = null;
    try {
      const [totalRecords, feverCount, abnormalCount, reportedCount] = await Promise.all([
        db.temperatureRecord.count(),
        db.temperatureRecord.count({ where: { isFever: 1 } }),
        db.temperatureRecord.count({ where: { isAbnormal: 1 } }),
        db.temperatureRecord.count({ where: { autoReported: 1 } }),
      ]);

      const feverLevelBreakdown = await db.temperatureRecord.groupBy({
        by: ['feverLevel'],
        _count: { id: true },
      });

      const deptBreakdownRaw = await db.temperatureRecord.groupBy({
        by: ['dept'],
        _count: { id: true },
      });

      const deptFeverCounts = await db.temperatureRecord.groupBy({
        by: ['dept'],
        _count: { id: true },
        where: { isFever: 1 },
      });

      const deptMap = new Map<string, { total: number; fever: number }>();
      for (const d of deptBreakdownRaw) {
        deptMap.set(d.dept, { total: d._count.id, fever: 0 });
      }
      for (const d of deptFeverCounts) {
        const entry = deptMap.get(d.dept);
        if (entry) entry.fever = d._count.id;
      }

      temperatureStats = {
        totalRecords,
        feverCount,
        abnormalCount,
        reportedCount,
        feverLevelBreakdown: feverLevelBreakdown.map(f => ({ feverLevel: f.feverLevel, count: f._count.id })),
        deptBreakdown: Array.from(deptMap.entries()).map(([dept, counts]) => ({ dept, ...counts })),
      };
    } catch {
      // Temperature stats not available
    }

    return NextResponse.json({
      businessScenarios: scenarios,
      fieldMappings,
      conversionRules: convRules,
      validationRules: valRules,
      consistencyIssues: consIssues,
      temperatureStats,
      summary: {
        totalScenarios: scenarios.length,
        highPriorityCount: scenarios.filter(s => s.priority === '高').length,
        mediumPriorityCount: scenarios.filter(s => s.priority === '中').length,
        totalFieldMappings: Object.values(fieldMappings).reduce((sum, fields) => sum + fields.length, 0),
        totalConversionRules: convRules.length,
        totalValidationRules: valRules.length,
        totalConsistencyIssues: consIssues.length,
        highSeverityIssues: consIssues.filter(i => i.severity === '高').length,
      },
    });
  } catch (error: any) {
    console.error('HIS mapping API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIS mapping data', message: error.message },
      { status: 500 }
    );
  }
}
