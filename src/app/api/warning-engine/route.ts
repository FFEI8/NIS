import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'evaluate') {
      // Evaluate all enabled warning rules against current data
      const rules = await db.warningRule.findMany({ where: { enabled: 1 } });
      const results: any[] = [];
      let warningsTriggered = 0;

      for (const rule of rules) {
        try {
          // Check cooldown - don't re-trigger if recently triggered
          if (rule.lastTriggeredAt && rule.cooldownMinutes > 0) {
            const cooldownMs = rule.cooldownMinutes * 60 * 1000;
            const timeSinceLastTrigger = Date.now() - new Date(rule.lastTriggeredAt).getTime();
            if (timeSinceLastTrigger < cooldownMs) {
              results.push({ ruleId: rule.id, ruleName: rule.name, triggered: false, reason: '冷却期内' });
              continue;
            }
          }

          const triggered = await evaluateRule(rule);
          if (triggered) {
            warningsTriggered++;
            results.push({ ruleId: rule.id, ruleName: rule.name, triggered: true, detail: triggered });

            // Update rule trigger count
            await db.warningRule.update({
              where: { id: rule.id },
              data: { triggerCount: { increment: 1 }, lastTriggeredAt: new Date() },
            });

            // Create warning record for each matched patient
            const matchedRecords = triggered.matchedRecords || [triggered];
            for (const match of matchedRecords.slice(0, 5)) {
              await db.warningRecord.create({
                data: {
                  patientId: match.patientId || '',
                  patientName: match.patientName || '',
                  dept: match.dept || '',
                  warningType: rule.warningType,
                  warningLevel: rule.warningLevel,
                  description: `规则[${rule.name}]触发: ${match.description || rule.description}`,
                  status: '待处理',
                },
              });
            }

            // Create rule log
            await db.warningRuleLog.create({
              data: {
                ruleId: rule.id,
                ruleName: rule.name,
                ruleCode: rule.code,
                triggerSource: triggered.sourceType === 'micro_lab' ? 'micro_lab' : triggered.sourceType === 'id_lab' ? 'id_lab' : 'warning_engine',
                sourceId: triggered.sourceId || triggered.matchedRecords?.[0]?.sourceId,
                sourceType: triggered.sourceType,
                sourceDetail: JSON.stringify(triggered.matchedRecords?.map((r: any) => ({
                  patientId: r.patientId,
                  dept: r.dept,
                  reportItemName: r.reportItemName,
                  testItemName: r.testItemName,
                  diseaseName: r.diseaseName,
                  diseaseCategory: r.diseaseCategory,
                })) || {}),
                patientId: triggered.patientId || triggered.matchedRecords?.[0]?.patientId,
                dept: triggered.dept || triggered.matchedRecords?.[0]?.dept,
                warningLevel: rule.warningLevel,
                warningType: rule.warningType,
                actionTaken: rule.actionType,
                status: '已触发',
              },
            });

            // Mark source records as warning triggered
            if (triggered.matchedRecords) {
              for (const match of triggered.matchedRecords) {
                if (match.sourceId && match.sourceType === 'micro_lab') {
                  try {
                    await db.microLabResult.update({
                      where: { id: match.sourceId },
                      data: { warningTriggered: 1 },
                    });
                  } catch { /* already updated */ }
                }
                if (match.sourceId && match.sourceType === 'temperature') {
                  try {
                    await db.temperatureRecord.update({
                      where: { id: match.sourceId },
                      data: { warningTriggered: 1 },
                    });
                  } catch { /* already updated */ }
                }
                if (match.sourceId && match.sourceType === 'id_lab') {
                  try {
                    await db.infectiousDiseaseLabResult.update({
                      where: { id: match.sourceId },
                      data: { warningTriggered: 1 },
                    });
                  } catch { /* already updated */ }
                }
              }
            } else if (triggered.sourceType === 'micro_lab' && triggered.sourceId) {
              try {
                await db.microLabResult.update({
                  where: { id: triggered.sourceId },
                  data: { warningTriggered: 1 },
                });
              } catch { /* already updated */ }
            } else if (triggered.sourceType === 'temperature' && triggered.sourceId) {
              try {
                await db.temperatureRecord.update({
                  where: { id: triggered.sourceId },
                  data: { warningTriggered: 1 },
                });
              } catch { /* already updated */ }
            } else if (triggered.sourceType === 'id_lab' && triggered.sourceId) {
              try {
                await db.infectiousDiseaseLabResult.update({
                  where: { id: triggered.sourceId },
                  data: { warningTriggered: 1 },
                });
              } catch { /* already updated */ }
            }
          } else {
            results.push({ ruleId: rule.id, ruleName: rule.name, triggered: false });
          }
        } catch (e: any) {
          results.push({ ruleId: rule.id, ruleName: rule.name, triggered: false, error: e.message });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          totalRules: rules.length,
          warningsTriggered,
          results,
          message: `评估完成：共 ${rules.length} 条规则，触发 ${warningsTriggered} 条预警`,
        },
      });
    }

    if (action === 'test') {
      // Test a specific rule
      const { ruleId } = body;
      if (!ruleId) {
        return NextResponse.json({ success: false, message: '缺少ruleId参数' }, { status: 400 });
      }

      const rule = await db.warningRule.findUnique({ where: { id: ruleId } });
      if (!rule) {
        return NextResponse.json({ success: false, message: '规则不存在' }, { status: 404 });
      }

      const testResult = await testRule(rule);

      return NextResponse.json({
        success: true,
        data: testResult,
      });
    }

    return NextResponse.json({ success: false, message: '未知的action参数' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function evaluateRule(rule: any): Promise<any | null> {
  const { conditionField, conditionOperator, conditionValue, timeWindow, category } = rule;

  // Calculate time window - use a very large window for testing
  const now = new Date();
  const windowMs = (timeWindow || 24) * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // MDRO-specific detection: when operator is 'contains' and field is 'mdroDetection'
    if (conditionField === 'mdroDetection' && conditionOperator === 'contains') {
      // Find MDRO lab results where reportItemName contains the bacteria name
      const bacteriaName = conditionValue;
      const mdroResults = await db.microLabResult.findMany({
        where: {
          isMDRO: 1,
          reportItemName: { contains: bacteriaName },
          reportTime: { gte: windowStart },
          ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
        },
        orderBy: { reportTime: 'desc' },
      });

      if (mdroResults.length > 0) {
        const matchedRecords = mdroResults.map(r => ({
          patientId: r.patientId,
          patientName: r.patientName,
          dept: r.dept,
          sourceId: r.id,
          sourceType: 'micro_lab',
          reportItemName: r.reportItemName,
          resultValue: r.resultValue,
          description: `检出${r.reportItemName}(${r.resultValue || '阳性'})`,
        }));

        return {
          patientId: mdroResults[0]?.patientId || '',
          patientName: mdroResults[0]?.patientName || '',
          dept: mdroResults[0]?.dept || '',
          sourceId: mdroResults[0]?.id || '',
          sourceType: 'micro_lab',
          description: `${timeWindow}小时内检出${bacteriaName}共${mdroResults.length}例`,
          matchCount: mdroResults.length,
          matchedRecords,
        };
      }
      return null;
    }

    switch (conditionField) {
      case 'mdroDetection': {
        // Generic MDRO detection (numeric threshold check)
        const mdroResults = await db.microLabResult.findMany({
          where: {
            isMDRO: 1,
            reportTime: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
          orderBy: { reportTime: 'desc' },
        });
        const threshold = parseInt(conditionValue) || 1;
        if (compareValue(mdroResults.length, conditionOperator, threshold)) {
          const matchedRecords = mdroResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName,
            dept: r.dept,
            sourceId: r.id,
            sourceType: 'micro_lab',
            reportItemName: r.reportItemName,
            description: `检出${r.reportItemName}`,
          }));
          return {
            patientId: mdroResults[0]?.patientId || '',
            patientName: mdroResults[0]?.patientName || '',
            dept: mdroResults[0]?.dept || '',
            sourceId: mdroResults[0]?.id || '',
            sourceType: 'micro_lab',
            description: `${timeWindow}小时内检出${mdroResults.length}例MDRO（阈值${threshold}）`,
            matchCount: mdroResults.length,
            matchedRecords,
          };
        }
        return null;
      }

      case 'mdroCount': {
        // Count-based MDRO detection (for cluster rules)
        // If conditionValue is a bacteria name and operator is 'contains', do bacteria-specific count
        if (conditionOperator === 'contains') {
          const bacteriaName = conditionValue;
          const mdroResults = await db.microLabResult.findMany({
            where: {
              isMDRO: 1,
              reportItemName: { contains: bacteriaName },
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { reportTime: 'desc' },
          });
          if (mdroResults.length > 0) {
            return {
              patientId: '',
              dept: rule.targetDepts || '',
              sourceType: 'micro_lab',
              description: `${timeWindow}小时内${bacteriaName}检出数${mdroResults.length}`,
              matchCount: mdroResults.length,
              matchedRecords: mdroResults.map(r => ({
                patientId: r.patientId,
                patientName: r.patientName,
                dept: r.dept,
                sourceId: r.id,
                sourceType: 'micro_lab',
                reportItemName: r.reportItemName,
              })),
            };
          }
          return null;
        }

        // Numeric count threshold
        const mdroCount = await db.microLabResult.count({
          where: {
            isMDRO: 1,
            reportTime: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
        });

        // For cluster rules, check per-department counts
        if (rule.ruleType === '聚集预警') {
          const deptCounts = await db.microLabResult.groupBy({
            by: ['dept'],
            where: {
              isMDRO: 1,
              reportTime: { gte: windowStart },
              dept: { not: null },
            },
            _count: true,
          });
          const threshold = parseInt(conditionValue) || 3;
          for (const dc of deptCounts) {
            if (compareValue(dc._count, conditionOperator, threshold)) {
              // Get the matching records for this department
              const deptResults = await db.microLabResult.findMany({
                where: {
                  isMDRO: 1,
                  reportTime: { gte: windowStart },
                  dept: dc.dept,
                },
                orderBy: { reportTime: 'desc' },
              });
              return {
                patientId: '',
                dept: dc.dept || '',
                sourceType: 'micro_lab',
                description: `${dc.dept}科室${timeWindow}小时内检出${dc._count}例MDRO（阈值${threshold}），存在聚集风险`,
                matchCount: dc._count,
                matchedRecords: deptResults.map(r => ({
                  patientId: r.patientId,
                  patientName: r.patientName,
                  dept: r.dept,
                  sourceId: r.id,
                  sourceType: 'micro_lab',
                  reportItemName: r.reportItemName,
                })),
              };
            }
          }
          return null;
        }

        const threshold = parseInt(conditionValue) || 1;
        if (compareValue(mdroCount, conditionOperator, threshold)) {
          return {
            patientId: '',
            dept: rule.targetDepts || '',
            sourceType: 'micro_lab',
            description: `${timeWindow}小时内MDRO检出数${mdroCount}（阈值${threshold}）`,
            matchCount: mdroCount,
          };
        }
        return null;
      }

      case 'infectionRate': {
        const cases = await db.infectionCase.count({
          where: {
            infectionDate: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
        });
        const threshold = parseFloat(conditionValue) || 5;
        if (compareValue(cases, conditionOperator, threshold)) {
          const latest = await db.infectionCase.findFirst({
            where: { infectionDate: { gte: windowStart } },
            orderBy: { infectionDate: 'desc' },
          });
          return {
            patientId: latest?.patientId || '',
            patientName: latest?.patientName || '',
            dept: latest?.dept || '',
            sourceId: latest?.id || '',
            sourceType: 'infection_case',
            description: `${timeWindow}小时内感染率指标${cases}（阈值${threshold}）`,
            matchCount: cases,
          };
        }
        return null;
      }

      case 'caseCount': {
        const count = await db.infectionCase.count({
          where: {
            infectionDate: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
        });
        const threshold = parseInt(conditionValue) || 3;
        if (compareValue(count, conditionOperator, threshold)) {
          return {
            sourceType: 'infection_case',
            description: `${timeWindow}小时内新增${count}例感染（阈值${threshold}）`,
            matchCount: count,
          };
        }
        return null;
      }

      case 'temperature': {
        // Query TemperatureRecord where temperature >= threshold within timeWindow
        const tempThreshold = parseFloat(conditionValue) || 38.0;
        const tempRecords = await db.temperatureRecord.findMany({
          where: {
            temperature: { gte: tempThreshold },
            measureTime: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
          orderBy: { measureTime: 'desc' },
        });
        if (compareValue(tempRecords.length, conditionOperator, parseInt(conditionValue) || 1) || tempRecords.length > 0) {
          const matchedRecords = tempRecords.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName,
            dept: r.dept,
            sourceId: r.id,
            sourceType: 'temperature',
            temperature: r.temperature,
            measureTime: r.measureTime,
            description: `体温${r.temperature}℃（${r.feverLevel || '异常'}）`,
          }));
          return {
            patientId: tempRecords[0]?.patientId || '',
            patientName: tempRecords[0]?.patientName || '',
            dept: tempRecords[0]?.dept || '',
            sourceId: tempRecords[0]?.id || '',
            sourceType: 'temperature',
            description: `${timeWindow}小时内体温≥${tempThreshold}℃共${tempRecords.length}例`,
            matchCount: tempRecords.length,
            matchedRecords,
          };
        }
        return null;
      }

      case 'idLabPositive': {
        // Infectious disease lab positive detection
        // When operator is 'contains': search InfectiousDiseaseLabResult where isPositive=1 AND testItemName contains conditionValue
        if (conditionOperator === 'contains') {
          const testName = conditionValue;
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              testItemName: { contains: testName },
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { reportTime: 'desc' },
          });

          if (idLabResults.length > 0) {
            const matchedRecords = idLabResults.map(r => ({
              patientId: r.patientId,
              patientName: r.patientName,
              dept: r.dept,
              sourceId: r.id,
              sourceType: 'id_lab',
              testItemName: r.testItemName,
              resultValue: r.resultValue,
              diseaseName: r.diseaseName,
              diseaseCategory: r.diseaseCategory,
              description: `检出${r.testItemName}(${r.resultValue || '阳性'})${r.diseaseName ? '，关联传染病：' + r.diseaseName : ''}`,
            }));

            return {
              patientId: idLabResults[0]?.patientId || '',
              patientName: idLabResults[0]?.patientName || '',
              dept: idLabResults[0]?.dept || '',
              sourceId: idLabResults[0]?.id || '',
              sourceType: 'id_lab',
              description: `${timeWindow}小时内${testName}阳性检出${idLabResults.length}例`,
              matchCount: idLabResults.length,
              matchedRecords,
            };
          }
          return null;
        }

        // When operator is 'gt'/'gte': count positive results and compare with threshold
        const positiveCount = await db.infectiousDiseaseLabResult.count({
          where: {
            isPositive: 1,
            reportTime: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            ...(conditionOperator === 'contains' ? { testItemName: { contains: conditionValue } } : {}),
          },
        });

        const threshold = parseInt(conditionValue) || 1;
        if (compareValue(positiveCount, conditionOperator, threshold)) {
          // Fetch the matching records for detail
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { reportTime: 'desc' },
            take: 20,
          });

          const matchedRecords = idLabResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName,
            dept: r.dept,
            sourceId: r.id,
            sourceType: 'id_lab',
            testItemName: r.testItemName,
            resultValue: r.resultValue,
            diseaseName: r.diseaseName,
            diseaseCategory: r.diseaseCategory,
            description: `检出${r.testItemName}(${r.resultValue || '阳性'})`,
          }));

          return {
            patientId: idLabResults[0]?.patientId || '',
            patientName: idLabResults[0]?.patientName || '',
            dept: idLabResults[0]?.dept || '',
            sourceId: idLabResults[0]?.id || '',
            sourceType: 'id_lab',
            description: `${timeWindow}小时内传染病检验阳性${positiveCount}例（阈值${threshold}）`,
            matchCount: positiveCount,
            matchedRecords,
          };
        }
        return null;
      }

      case 'idLabCount': {
        // Infectious disease lab result count (for cluster detection)
        // Build filter - optionally filter by targetDiseases (match diseaseName)
        const targetDiseaseList = rule.targetDiseases
          ? rule.targetDiseases.split(',').map((d: string) => d.trim()).filter(Boolean)
          : [];

        const baseWhere = {
          reportTime: { gte: windowStart },
          ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          ...(targetDiseaseList.length > 0 ? { diseaseName: { in: targetDiseaseList } } : {}),
        };

        // For cluster rules, check per-department counts
        if (rule.ruleType === '聚集预警') {
          const deptCounts = await db.infectiousDiseaseLabResult.groupBy({
            by: ['dept'],
            where: {
              ...baseWhere,
              dept: { not: null },
            },
            _count: true,
          });

          const threshold = parseInt(conditionValue) || 3;
          for (const dc of deptCounts) {
            if (compareValue(dc._count, conditionOperator, threshold)) {
              // Get the matching records for this department
              const deptResults = await db.infectiousDiseaseLabResult.findMany({
                where: {
                  ...baseWhere,
                  dept: dc.dept,
                },
                orderBy: { reportTime: 'desc' },
              });

              const matchedRecords = deptResults.map(r => ({
                patientId: r.patientId,
                patientName: r.patientName,
                dept: r.dept,
                sourceId: r.id,
                sourceType: 'id_lab',
                testItemName: r.testItemName,
                resultValue: r.resultValue,
                diseaseName: r.diseaseName,
                diseaseCategory: r.diseaseCategory,
                description: `${r.testItemName}(${r.resultValue || '阳性'})`,
              }));

              return {
                patientId: '',
                dept: dc.dept || '',
                sourceType: 'id_lab',
                description: `${dc.dept}科室${timeWindow}小时内传染病检验${dc._count}例（阈值${threshold}），存在聚集风险`,
                matchCount: dc._count,
                matchedRecords,
              };
            }
          }
          return null;
        }

        // Numeric count threshold (non-cluster)
        const totalCount = await db.infectiousDiseaseLabResult.count({ where: baseWhere });
        const threshold = parseInt(conditionValue) || 1;

        if (compareValue(totalCount, conditionOperator, threshold)) {
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: baseWhere,
            orderBy: { reportTime: 'desc' },
            take: 20,
          });

          const matchedRecords = idLabResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName,
            dept: r.dept,
            sourceId: r.id,
            sourceType: 'id_lab',
            testItemName: r.testItemName,
            resultValue: r.resultValue,
            diseaseName: r.diseaseName,
            diseaseCategory: r.diseaseCategory,
            description: `${r.testItemName}(${r.resultValue || '阳性'})`,
          }));

          return {
            patientId: '',
            dept: rule.targetDepts || '',
            sourceType: 'id_lab',
            description: `${timeWindow}小时内传染病检验${totalCount}例（阈值${threshold}）`,
            matchCount: totalCount,
            matchedRecords,
          };
        }
        return null;
      }

      case 'notifiableDisease': {
        // Notifiable disease detection (for timeliness rules)
        // When operator is 'eq' and value is '甲类': Find positive results where diseaseCategory='甲类'
        if (conditionOperator === 'eq' && conditionValue === '甲类') {
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              diseaseCategory: '甲类',
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { reportTime: 'desc' },
          });

          if (idLabResults.length > 0) {
            const matchedRecords = idLabResults.map(r => ({
              patientId: r.patientId,
              patientName: r.patientName,
              dept: r.dept,
              sourceId: r.id,
              sourceType: 'id_lab',
              testItemName: r.testItemName,
              resultValue: r.resultValue,
              diseaseName: r.diseaseName,
              diseaseCategory: r.diseaseCategory,
              urgency: '甲类',
              reportTimeLimit: r.reportTimeLimit,
              description: `甲类传染病：${r.diseaseName || r.testItemName}(${r.resultValue || '阳性'})，需${r.reportTimeLimit || 2}小时内报告`,
            }));

            return {
              patientId: idLabResults[0]?.patientId || '',
              patientName: idLabResults[0]?.patientName || '',
              dept: idLabResults[0]?.dept || '',
              sourceId: idLabResults[0]?.id || '',
              sourceType: 'id_lab',
              description: `${timeWindow}小时内检出甲类传染病${idLabResults.length}例，需立即报告`,
              matchCount: idLabResults.length,
              matchedRecords,
            };
          }
          return null;
        }

        // When operator is 'timeout' and value is '乙类': Find positive results where diseaseCategory='乙类'
        // and autoReported=0 and created more than timeWindow hours ago
        if (conditionOperator === 'timeout' && conditionValue === '乙类') {
          const timeoutDate = new Date(now.getTime() - windowMs);
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              diseaseCategory: '乙类',
              autoReported: 0,
              createdAt: { lte: timeoutDate },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { createdAt: 'asc' },
          });

          if (idLabResults.length > 0) {
            const matchedRecords = idLabResults.map(r => {
              const createdTime = new Date(r.createdAt).getTime();
              const elapsedHours = Math.round((now.getTime() - createdTime) / (60 * 60 * 1000));
              const timeLimit = r.reportTimeLimit || 24;
              return {
                patientId: r.patientId,
                patientName: r.patientName,
                dept: r.dept,
                sourceId: r.id,
                sourceType: 'id_lab',
                testItemName: r.testItemName,
                resultValue: r.resultValue,
                diseaseName: r.diseaseName,
                diseaseCategory: r.diseaseCategory,
                urgency: '乙类',
                reportTimeLimit: timeLimit,
                elapsedHours,
                description: `乙类传染病超时：${r.diseaseName || r.testItemName}，已过${elapsedHours}小时（限时${timeLimit}小时）`,
              };
            });

            return {
              patientId: idLabResults[0]?.patientId || '',
              patientName: idLabResults[0]?.patientName || '',
              dept: idLabResults[0]?.dept || '',
              sourceId: idLabResults[0]?.id || '',
              sourceType: 'id_lab',
              description: `${idLabResults.length}例乙类传染病超时未报告（限时${timeWindow}小时）`,
              matchCount: idLabResults.length,
              matchedRecords,
            };
          }
          return null;
        }

        // Generic notifiable disease detection - find positive results that are notifiable
        const notifiableResults = await db.infectiousDiseaseLabResult.findMany({
          where: {
            isPositive: 1,
            isNotifiable: 1,
            reportTime: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            ...(conditionOperator === 'eq' ? { diseaseCategory: conditionValue } : {}),
          },
          orderBy: { reportTime: 'desc' },
        });

        if (notifiableResults.length > 0) {
          const matchedRecords = notifiableResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName,
            dept: r.dept,
            sourceId: r.id,
            sourceType: 'id_lab',
            testItemName: r.testItemName,
            resultValue: r.resultValue,
            diseaseName: r.diseaseName,
            diseaseCategory: r.diseaseCategory,
            urgency: r.diseaseCategory || '其他',
            reportTimeLimit: r.reportTimeLimit,
            description: `法定传染病：${r.diseaseName || r.testItemName}(${r.diseaseCategory})`,
          }));

          return {
            patientId: notifiableResults[0]?.patientId || '',
            patientName: notifiableResults[0]?.patientName || '',
            dept: notifiableResults[0]?.dept || '',
            sourceId: notifiableResults[0]?.id || '',
            sourceType: 'id_lab',
            description: `${timeWindow}小时内检出法定传染病${notifiableResults.length}例`,
            matchCount: notifiableResults.length,
            matchedRecords,
          };
        }
        return null;
      }

      default: {
        // Generic: try to match micro lab results for 多重耐药菌 category
        if (category === '多重耐药菌') {
          const mdroResults = await db.microLabResult.findMany({
            where: { isMDRO: 1, reportTime: { gte: windowStart } },
            orderBy: { reportTime: 'desc' },
          });
          if (mdroResults.length > 0) {
            return {
              patientId: mdroResults[0]?.patientId || '',
              patientName: mdroResults[0]?.patientName || '',
              dept: mdroResults[0]?.dept || '',
              sourceId: mdroResults[0]?.id || '',
              sourceType: 'micro_lab',
              description: `检出${mdroResults.length}例MDRO`,
              matchCount: mdroResults.length,
              matchedRecords: mdroResults.slice(0, 10).map(r => ({
                patientId: r.patientId,
                patientName: r.patientName,
                dept: r.dept,
                sourceId: r.id,
                sourceType: 'micro_lab',
                reportItemName: r.reportItemName,
              })),
            };
          }
        }
        return null;
      }
    }
  } catch {
    return null;
  }
}

async function testRule(rule: any): Promise<any> {
  const { conditionField, conditionOperator, conditionValue, timeWindow, category } = rule;
  const now = new Date();
  const windowMs = (timeWindow || 24) * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);

  let matchCount = 0;
  let affectedPatients: any[] = [];
  let affectedDepts: any[] = [];
  let wouldTrigger = false;
  let matchDetail = '';

  // MDRO-specific detection: when operator is 'contains'
  if (conditionField === 'mdroDetection' && conditionOperator === 'contains') {
    const bacteriaName = conditionValue;
    const mdroResults = await db.microLabResult.findMany({
      where: {
        isMDRO: 1,
        reportItemName: { contains: bacteriaName },
        reportTime: { gte: windowStart },
        ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
      },
      orderBy: { reportTime: 'desc' },
      take: 20,
    });
    matchCount = mdroResults.length;
    affectedPatients = mdroResults.map(r => ({
      patientId: r.patientId,
      patientName: r.patientName || '',
      mdroType: r.mdroType,
      reportItemName: r.reportItemName,
      resultValue: r.resultValue,
    }));
    affectedDepts = [...new Set(mdroResults.map(r => r.dept).filter(Boolean))];
    wouldTrigger = matchCount > 0;
    matchDetail = `匹配到${matchCount}条包含"${bacteriaName}"的检验结果`;
  } else {
    switch (conditionField) {
      case 'mdroDetection':
      case 'mdroCount': {
        const mdroResults = await db.microLabResult.findMany({
          where: {
            isMDRO: 1,
            reportTime: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
          orderBy: { reportTime: 'desc' },
          take: 20,
        });
        matchCount = mdroResults.length;
        affectedPatients = mdroResults.map(r => ({
          patientId: r.patientId,
          patientName: r.patientName || '',
          mdroType: r.mdroType,
        }));
        affectedDepts = [...new Set(mdroResults.map(r => r.dept).filter(Boolean))];
        const threshold = parseInt(conditionValue) || 1;
        wouldTrigger = compareValue(matchCount, conditionOperator, threshold);
        matchDetail = `${timeWindow}小时内MDRO检出${matchCount}例（阈值${threshold}）`;
        break;
      }
      case 'infectionRate':
      case 'caseCount': {
        const cases = await db.infectionCase.findMany({
          where: {
            infectionDate: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
          take: 20,
        });
        matchCount = cases.length;
        affectedPatients = cases.map(c => ({ patientId: c.patientId, patientName: c.patientName, dept: c.dept }));
        affectedDepts = [...new Set(cases.map(c => c.dept).filter(Boolean))];
        const threshold = parseInt(conditionValue) || 3;
        wouldTrigger = compareValue(matchCount, conditionOperator, threshold);
        matchDetail = `${timeWindow}小时内感染病例${matchCount}例（阈值${threshold}）`;
        break;
      }
      case 'temperature': {
        const tempThreshold = parseFloat(conditionValue) || 38.0;
        const tempRecords = await db.temperatureRecord.findMany({
          where: {
            temperature: { gte: tempThreshold },
            measureTime: { gte: windowStart },
            ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          },
          orderBy: { measureTime: 'desc' },
          take: 20,
        });
        matchCount = tempRecords.length;
        affectedPatients = tempRecords.map(r => ({
          patientId: r.patientId,
          patientName: r.patientName,
          dept: r.dept,
          temperature: r.temperature,
          feverLevel: r.feverLevel,
        }));
        affectedDepts = [...new Set(tempRecords.map(r => r.dept).filter(Boolean))];
        wouldTrigger = matchCount > 0;
        matchDetail = `${timeWindow}小时内体温≥${tempThreshold}℃共${matchCount}例`;
        break;
      }
      case 'idLabPositive': {
        // Test infectious disease lab positive detection
        if (conditionOperator === 'contains') {
          const testName = conditionValue;
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              testItemName: { contains: testName },
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { reportTime: 'desc' },
            take: 20,
          });
          matchCount = idLabResults.length;
          affectedPatients = idLabResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName || '',
            testItemName: r.testItemName,
            resultValue: r.resultValue,
            diseaseName: r.diseaseName,
            diseaseCategory: r.diseaseCategory,
          }));
          affectedDepts = [...new Set(idLabResults.map(r => r.dept).filter(Boolean))];
          wouldTrigger = matchCount > 0;
          matchDetail = `匹配到${matchCount}条包含"${testName}"的阳性传染病检验结果`;
        } else {
          // Numeric threshold check
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { reportTime: 'desc' },
            take: 20,
          });
          matchCount = idLabResults.length;
          affectedPatients = idLabResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName || '',
            testItemName: r.testItemName,
            resultValue: r.resultValue,
            diseaseName: r.diseaseName,
            diseaseCategory: r.diseaseCategory,
          }));
          affectedDepts = [...new Set(idLabResults.map(r => r.dept).filter(Boolean))];
          const threshold = parseInt(conditionValue) || 1;
          wouldTrigger = compareValue(matchCount, conditionOperator, threshold);
          matchDetail = `${timeWindow}小时内传染病检验阳性${matchCount}例（阈值${threshold}）`;
        }
        break;
      }
      case 'idLabCount': {
        // Test infectious disease lab result count
        const targetDiseaseList = rule.targetDiseases
          ? rule.targetDiseases.split(',').map((d: string) => d.trim()).filter(Boolean)
          : [];

        const testWhere = {
          reportTime: { gte: windowStart },
          ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
          ...(targetDiseaseList.length > 0 ? { diseaseName: { in: targetDiseaseList } } : {}),
        };

        const idLabResults = await db.infectiousDiseaseLabResult.findMany({
          where: testWhere,
          orderBy: { reportTime: 'desc' },
          take: 20,
        });
        matchCount = idLabResults.length;
        affectedPatients = idLabResults.map(r => ({
          patientId: r.patientId,
          patientName: r.patientName || '',
          testItemName: r.testItemName,
          diseaseName: r.diseaseName,
          diseaseCategory: r.diseaseCategory,
        }));
        affectedDepts = [...new Set(idLabResults.map(r => r.dept).filter(Boolean))];

        // For cluster rules, also check per-dept counts
        if (rule.ruleType === '聚集预警') {
          const deptCounts = await db.infectiousDiseaseLabResult.groupBy({
            by: ['dept'],
            where: { ...testWhere, dept: { not: null } },
            _count: true,
          });
          const threshold = parseInt(conditionValue) || 3;
          const maxDeptCount = deptCounts.length > 0 ? Math.max(...deptCounts.map(dc => dc._count)) : 0;
          wouldTrigger = deptCounts.some(dc => compareValue(dc._count, conditionOperator, threshold));
          const diseaseFilter = targetDiseaseList.length > 0 ? `（${targetDiseaseList.join('、')}）` : '';
          matchDetail = `${timeWindow}小时内传染病检验${diseaseFilter}共${matchCount}例，科室最高${maxDeptCount}例（阈值${threshold}）`;
        } else {
          const threshold = parseInt(conditionValue) || 1;
          wouldTrigger = compareValue(matchCount, conditionOperator, threshold);
          const diseaseFilter = targetDiseaseList.length > 0 ? `（${targetDiseaseList.join('、')}）` : '';
          matchDetail = `${timeWindow}小时内传染病检验${diseaseFilter}${matchCount}例（阈值${threshold}）`;
        }
        break;
      }
      case 'notifiableDisease': {
        // Test notifiable disease detection
        if (conditionOperator === 'eq' && conditionValue === '甲类') {
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              diseaseCategory: '甲类',
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { reportTime: 'desc' },
            take: 20,
          });
          matchCount = idLabResults.length;
          affectedPatients = idLabResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName || '',
            testItemName: r.testItemName,
            diseaseName: r.diseaseName,
            diseaseCategory: r.diseaseCategory,
            urgency: '甲类',
            reportTimeLimit: r.reportTimeLimit,
          }));
          affectedDepts = [...new Set(idLabResults.map(r => r.dept).filter(Boolean))];
          wouldTrigger = matchCount > 0;
          matchDetail = `匹配到${matchCount}例甲类传染病阳性，需立即报告`;
        } else if (conditionOperator === 'timeout' && conditionValue === '乙类') {
          const timeoutDate = new Date(now.getTime() - windowMs);
          const idLabResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              diseaseCategory: '乙类',
              autoReported: 0,
              createdAt: { lte: timeoutDate },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
            },
            orderBy: { createdAt: 'asc' },
            take: 20,
          });
          matchCount = idLabResults.length;
          affectedPatients = idLabResults.map(r => {
            const elapsedHours = Math.round((now.getTime() - new Date(r.createdAt).getTime()) / (60 * 60 * 1000));
            return {
              patientId: r.patientId,
              patientName: r.patientName || '',
              testItemName: r.testItemName,
              diseaseName: r.diseaseName,
              diseaseCategory: r.diseaseCategory,
              urgency: '乙类',
              reportTimeLimit: r.reportTimeLimit,
              elapsedHours,
            };
          });
          affectedDepts = [...new Set(idLabResults.map(r => r.dept).filter(Boolean))];
          wouldTrigger = matchCount > 0;
          matchDetail = `${matchCount}例乙类传染病超时未报告（限时${timeWindow}小时）`;
        } else {
          // Generic notifiable disease test
          const notifiableResults = await db.infectiousDiseaseLabResult.findMany({
            where: {
              isPositive: 1,
              isNotifiable: 1,
              reportTime: { gte: windowStart },
              ...(rule.targetDepts ? { dept: { in: rule.targetDepts.split(',').map((d: string) => d.trim()) } } : {}),
              ...(conditionOperator === 'eq' ? { diseaseCategory: conditionValue } : {}),
            },
            orderBy: { reportTime: 'desc' },
            take: 20,
          });
          matchCount = notifiableResults.length;
          affectedPatients = notifiableResults.map(r => ({
            patientId: r.patientId,
            patientName: r.patientName || '',
            testItemName: r.testItemName,
            diseaseName: r.diseaseName,
            diseaseCategory: r.diseaseCategory,
            urgency: r.diseaseCategory || '其他',
            reportTimeLimit: r.reportTimeLimit,
          }));
          affectedDepts = [...new Set(notifiableResults.map(r => r.dept).filter(Boolean))];
          wouldTrigger = matchCount > 0;
          matchDetail = `匹配到${matchCount}例法定传染病阳性`;
        }
        break;
      }
      default: {
        if (category === '多重耐药菌') {
          const allLab = await db.microLabResult.findMany({
            where: { isMDRO: 1, reportTime: { gte: windowStart } },
            take: 20,
          });
          matchCount = allLab.length;
          affectedDepts = [...new Set(allLab.map(r => r.dept).filter(Boolean))];
          wouldTrigger = matchCount > 0;
        }
      }
    }
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    ruleCode: rule.code,
    conditionField,
    conditionOperator,
    conditionValue,
    timeWindow,
    warningLevel: rule.warningLevel,
    warningType: rule.warningType,
    actionType: rule.actionType,
    matchCount,
    affectedPatients: affectedPatients.slice(0, 20),
    affectedDepts,
    wouldTrigger,
    matchDetail,
    message: wouldTrigger
      ? `规则将触发：${matchDetail}，影响${affectedPatients.length}个患者、${affectedDepts.length}个科室`
      : `规则未触发：${matchDetail || `匹配${matchCount}条记录，未达到阈值`}`,
  };
}

function compareValue(actual: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case 'gt': return actual > threshold;
    case 'lt': return actual < threshold;
    case 'eq': return actual === threshold;
    case 'gte': return actual >= threshold;
    case 'lte': return actual <= threshold;
    default: return actual >= threshold;
  }
}
