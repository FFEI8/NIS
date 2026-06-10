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

    // Fetch temperature stats
    let temperatureStats = null;
    try {
      const tempStatsUrl = new URL('/api/temperature-records/stats', 'http://localhost:3000');
      const tempRes = await fetch(tempStatsUrl);
      if (tempRes.ok) {
        temperatureStats = await tempRes.json();
      }
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
