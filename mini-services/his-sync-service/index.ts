// ============================================================================
// HIS数据同步微服务 - 医院感染管理系统
// 支持：数据库直连、同步表、ESB、API 四种同步方案
// HIS数据库：Microsoft SQL Server 2016
// 使用Bun内置SQLite，无需外部依赖
// ============================================================================

import { Database } from 'bun:sqlite';
import { randomBytes } from 'crypto';

const PORT = 3030;
const DB_PATH = '/tmp/my-project/db/custom.db';

// CUID generator
function cuid(): string {
  const letter = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  const random = randomBytes(18).toString('hex');
  return letter + random;
}

// SQLite connection
let db: Database;
function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
  }
  return db;
}

// Parse JSON config safely
function parseJsonConfig(jsonStr: string | null | undefined): any {
  if (!jsonStr) return {};
  try { return JSON.parse(jsonStr); } catch { return {}; }
}

// ============================================================================
// DDL: Initialize tables on startup
// ============================================================================
function initializeTables() {
  const db = getDb();

  db.exec(`CREATE TABLE IF NOT EXISTS HisSyncConfig (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    syncMode TEXT NOT NULL,
    businessScenario TEXT NOT NULL,
    hisDbType TEXT DEFAULT 'mssql',
    hisHost TEXT,
    hisPort TEXT,
    hisDatabase TEXT,
    hisUsername TEXT,
    hisPassword TEXT,
    hisOptions TEXT,
    hisTableName TEXT,
    syncTableName TEXT,
    esbEndpoint TEXT,
    esbAuthConfig TEXT,
    apiEndpoint TEXT,
    apiAuthType TEXT,
    apiAuthConfig TEXT,
    syncQuery TEXT,
    fieldMapping TEXT,
    transformRules TEXT,
    incrementalField TEXT,
    syncInterval INTEGER DEFAULT 300,
    batchSize INTEGER DEFAULT 500,
    enabled INTEGER DEFAULT 1,
    autoWarning INTEGER DEFAULT 1,
    connectionStatus TEXT DEFAULT '未测试',
    lastTestTime TEXT,
    lastSyncTime TEXT,
    lastSyncStatus TEXT,
    lastSyncCount INTEGER,
    lastSyncError TEXT,
    totalSyncCount INTEGER DEFAULT 0,
    totalFailCount INTEGER DEFAULT 0,
    description TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS HisSyncLog (
    id TEXT PRIMARY KEY,
    configId TEXT NOT NULL,
    configName TEXT,
    syncMode TEXT,
    businessScenario TEXT,
    triggerType TEXT,
    startTime TEXT,
    endTime TEXT,
    duration INTEGER,
    status TEXT,
    sourceCount INTEGER DEFAULT 0,
    targetCount INTEGER DEFAULT 0,
    skippedCount INTEGER DEFAULT 0,
    errorCount INTEGER DEFAULT 0,
    warningCount INTEGER DEFAULT 0,
    dataSample TEXT,
    logDetail TEXT,
    errorDetail TEXT,
    operator TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS TemperatureRecord (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    patientName TEXT,
    gender TEXT,
    age INTEGER,
    dept TEXT,
    bedNo TEXT,
    visitId TEXT,
    temperature REAL,
    measureRoute TEXT,
    measureTime TEXT,
    nurseName TEXT,
    hisSource TEXT,
    isAbnormal INTEGER DEFAULT 0,
    isFever INTEGER DEFAULT 0,
    feverLevel TEXT,
    syncStatus TEXT,
    syncTime TEXT,
    autoReported INTEGER DEFAULT 0,
    symptomSurveillanceId TEXT,
    warningTriggered INTEGER DEFAULT 0,
    warningId TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS MicroLabResult (
    id TEXT PRIMARY KEY,
    testId TEXT,
    patientId TEXT,
    patientName TEXT,
    visitId TEXT,
    orderNo TEXT,
    dept TEXT,
    bedNo TEXT,
    specimenType TEXT,
    specimenNo TEXT,
    collectTime TEXT,
    receiveTime TEXT,
    reportTime TEXT,
    reportItemName TEXT,
    reportItemCode TEXT,
    resultValue TEXT,
    resultText TEXT,
    isAbnormal INTEGER DEFAULT 0,
    isMDRO INTEGER DEFAULT 0,
    mdroType TEXT,
    organismName TEXT,
    status TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS SymptomSurveillance (
    id TEXT PRIMARY KEY,
    dept TEXT,
    patientId TEXT,
    patientName TEXT,
    gender TEXT,
    age INTEGER,
    temperature REAL,
    symptomGroup TEXT,
    symptomDetail TEXT,
    onsetDate TEXT,
    reporter TEXT,
    alertTriggered INTEGER DEFAULT 0,
    status TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS WarningRecord (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    patientName TEXT,
    dept TEXT,
    warningType TEXT,
    warningLevel TEXT,
    description TEXT,
    status TEXT
  )`);

  console.log('✅ 数据库表初始化完成');
}

// Initialize tables on startup
initializeTables();

// ============================================================================
// Temperature fever level calculation
// ============================================================================
function calculateFeverLevel(temperature: number): { isAbnormal: number; isFever: number; feverLevel: string } {
  if (temperature < 37.3) return { isAbnormal: 0, isFever: 0, feverLevel: '正常' };
  if (temperature < 38.0) return { isAbnormal: 1, isFever: 0, feverLevel: '低热' };
  if (temperature < 39.0) return { isAbnormal: 1, isFever: 1, feverLevel: '中度发热' };
  if (temperature < 41.0) return { isAbnormal: 1, isFever: 1, feverLevel: '高热' };
  return { isAbnormal: 1, isFever: 1, feverLevel: '超高热' };
}

// ============================================================================
// Data transform engine
// ============================================================================
function applyTransform(value: any, rule: any): any {
  if (typeof rule === 'object' && rule !== null) {
    switch (rule.type) {
      case 'date_format':
        return value ? new Date(value).toISOString() : null;
      case 'code_map':
      case 'value_map':
        return rule.mapping?.[String(value)] ?? value;
      case 'default':
        return value ?? rule.defaultValue;
      case 'number':
        return value != null ? Number(value) : null;
      default:
        return value;
    }
  }
  return value;
}

function transformRow(hisRow: any, fieldMap: Record<string, string>, transformRules?: Record<string, any>): any {
  const result: any = {};
  for (const [systemField, hisField] of Object.entries(fieldMap)) {
    let value = hisRow[hisField];
    if (transformRules && transformRules[systemField]) {
      value = applyTransform(value, transformRules[systemField]);
    }
    result[systemField] = value;
  }
  return result;
}

// ============================================================================
// Mock SQL Server data generator
// ============================================================================
function generateMockHISData(scenario: string, count: number = 20): any[] {
  const now = new Date();
  const records: any[] = [];

  if (scenario === 'temperature') {
    const depts = ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '感染科', '呼吸科', '神经外科', '肿瘤科'];
    const routes = ['腋下', '口腔', '耳温', '额温'];
    const names = ['张明', '李华', '王强', '赵丽', '刘伟', '陈芳', '杨军', '黄秀', '周杰', '吴敏',
      '郑文', '冯武', '孙成', '朱康', '何德', '马建', '罗国', '梁安', '宋平', '谢辉'];
    for (let i = 0; i < count; i++) {
      let temp: number;
      const rand = Math.random();
      if (rand < 0.3) temp = 36.0 + Math.random() * 1.2;
      else if (rand < 0.55) temp = 37.3 + Math.random() * 0.6;
      else if (rand < 0.80) temp = 38.0 + Math.random() * 0.9;
      else if (rand < 0.95) temp = 39.0 + Math.random() * 1.0;
      else temp = 40.0 + Math.random() * 1.5;
      temp = Math.round(temp * 10) / 10;
      records.push({
        PatientID: `P${String(20240100 + i).padStart(8, '0')}`,
        PatientName: names[i % names.length],
        Gender: i % 3 === 0 ? '女' : '男',
        Age: 20 + Math.floor(Math.random() * 60),
        DeptName: depts[i % depts.length],
        BedNo: `${depts[i % depts.length].charAt(0)}-${String((i % 15) + 1).padStart(2, '0')}`,
        VisitID: `V${String(20240100 + i).padStart(8, '0')}`,
        Temperature: temp,
        MeasureRoute: routes[i % routes.length],
        MeasureTime: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        NurseName: `护士${String(i % 5 + 1).padStart(2, '0')}`,
        DataSource: 'HIS自动推送',
        CreateTime: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      });
    }
  } else if (scenario === 'micro_lab') {
    const depts = ['ICU', '呼吸科', '外科', '内科', '肿瘤科', '血液科', '肾内科', '烧伤科'];
    const specimens = ['痰液', '尿液', '血液', '分泌物', '肺泡灌洗液', '脑脊液'];
    const organisms = [
      { name: '鲍曼不动杆菌', mdroType: 'CRAB', isMDRO: true },
      { name: '肺炎克雷伯菌', mdroType: 'CRKP', isMDRO: true },
      { name: '铜绿假单胞菌', mdroType: 'CRPA', isMDRO: true },
      { name: '金黄色葡萄球菌', mdroType: 'MRSA', isMDRO: true },
      { name: '屎肠球菌', mdroType: 'VRE', isMDRO: true },
      { name: '大肠埃希菌', mdroType: null, isMDRO: false },
      { name: '白色念珠菌', mdroType: null, isMDRO: false },
      { name: '阴沟肠杆菌', mdroType: null, isMDRO: false },
    ];
    const names = ['张明', '李华', '王强', '赵丽', '刘伟', '陈芳', '杨军', '黄秀', '周杰', '吴敏'];
    for (let i = 0; i < count; i++) {
      const org = organisms[i % organisms.length];
      records.push({
        TestID: `LIS${String(202401000 + i).padStart(10, '0')}`,
        PatientID: `P${String(20240100 + i).padStart(8, '0')}`,
        PatientName: names[i % names.length],
        VisitID: `V${String(20240100 + i).padStart(8, '0')}`,
        OrderNo: `ORD${String(20240100 + i).padStart(10, '0')}`,
        DeptName: depts[i % depts.length],
        BedNo: `${depts[i % depts.length].charAt(0)}-${String((i % 10) + 1).padStart(2, '0')}`,
        SpecimenType: specimens[i % specimens.length],
        SpecimenNo: `SP${String(202401000 + i).padStart(10, '0')}`,
        CollectTime: new Date(now.getTime() - Math.random() * 72 * 60 * 60 * 1000).toISOString(),
        ReceiveTime: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
        ReportTime: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        ReportItemName: `${org.name}${org.isMDRO ? `[${org.mdroType}]` : ''}`,
        ReportItemCode: `CODE_${String(i).padStart(4, '0')}`,
        ResultValue: org.isMDRO ? '阳性' : '阴性',
        ResultText: org.isMDRO ? `检出${org.name}` : `未检出致病菌`,
        OrganismName: org.name,
        IsMDRO: org.isMDRO ? 1 : 0,
        MDROType: org.mdroType || '',
        IsAbnormal: org.isMDRO ? 1 : 0,
        CreateTime: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  } else if (scenario === 'patient_info') {
    const depts = ['ICU', '外科', '内科', '儿科', '妇产科'];
    const names = ['张明', '李华', '王强', '赵丽', '刘伟', '陈芳', '杨军', '黄秀'];
    for (let i = 0; i < count; i++) {
      records.push({
        PatientID: `P${String(20240100 + i).padStart(8, '0')}`,
        PatientName: names[i % names.length],
        Gender: i % 3 === 0 ? '女' : '男',
        Age: 20 + Math.floor(Math.random() * 60),
        DeptName: depts[i % depts.length],
        BedNo: `${depts[i % depts.length].charAt(0)}-${String((i % 10) + 1).padStart(2, '0')}`,
        AdmissionDate: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        DiagnoseName: '待诊断',
        CreateTime: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      });
    }
  } else if (scenario === 'infectious_lab') {
    const testItems = [
      { code: '9197', name: '感染八项(WS)', subItems: ['HBsAg', 'Anti-HBs', 'HBeAg', 'Anti-HBe', 'Anti-HBc', 'Anti-HCV', 'Anti-HIV', 'TP-Ab'] },
      { code: '9185', name: '肝功能', subItems: ['ALT', 'AST'] },
      { code: '9201', name: '传染病四项', subItems: ['HBsAg', 'Anti-HCV', 'Anti-HIV', 'TP-Ab'] },
    ];
    const names = ['张明', '李华', '王强', '赵丽', '刘伟'];
    const depts = ['ICU', '感染科', '内科', '呼吸科'];
    for (let i = 0; i < count; i++) {
      const test = testItems[i % testItems.length];
      const subItem = test.subItems[i % test.subItems.length];
      const isPositive = Math.random() > 0.7;
      records.push({
        TestCode: test.code, TestName: test.name,
        SubItemNo: String(i % test.subItems.length + 1).padStart(2, '0'),
        SubItemName: subItem,
        PatientID: `P${String(20240100 + i).padStart(8, '0')}`,
        PatientName: names[i % names.length],
        DeptName: depts[i % depts.length],
        ResultValue: isPositive ? '阳性(+)' : '阴性(-)',
        IsPositive: isPositive ? 1 : 0,
        ReportTime: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        CreateTime: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      });
    }
  }
  return records;
}

// ============================================================================
// Sync execution engine
// ============================================================================
function executeSync(configId: string, triggerType: string = 'manual', operator?: string): any {
  const db = getDb();
  const config = db.query('SELECT * FROM HisSyncConfig WHERE id = ?').get(configId) as any;
  if (!config) throw new Error('同步配置不存在');

  const startTime = new Date();
  const logId = cuid();

  // Create running log
  db.run(`INSERT INTO HisSyncLog (id, configId, configName, syncMode, businessScenario, triggerType, startTime, status, operator)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    logId, config.id, config.name, config.syncMode, config.businessScenario, triggerType,
    startTime.toISOString(), '运行中', operator || null
  );

  try {
    let sourceCount = 0;
    let targetCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let dataSample: any[] = [];
    let logDetails: string[] = [];

    logDetails.push(`[${startTime.toISOString()}] 开始执行同步任务: ${config.name}`);
    logDetails.push(`同步方案: ${config.syncMode}, 业务场景: ${config.businessScenario}`);

    let hisData: any[] = [];

    switch (config.syncMode) {
      case 'direct': {
        logDetails.push(`连接HIS数据库: ${config.hisHost}:${config.hisPort}/${config.hisDatabase}`);
        // In production: use mssql package
        hisData = generateMockHISData(config.businessScenario, 20);
        logDetails.push(`[模拟] 从HIS读取 ${hisData.length} 条记录`);
        break;
      }
      case 'sync_table': {
        logDetails.push(`读取HIS同步表: ${config.syncTableName}`);
        hisData = generateMockHISData(config.businessScenario, 15);
        logDetails.push(`[模拟] 从同步表读取 ${hisData.length} 条未同步记录`);
        break;
      }
      case 'esb': {
        logDetails.push(`调用ESB服务: ${config.esbEndpoint}`);
        hisData = generateMockHISData(config.businessScenario, 12);
        logDetails.push(`[模拟] ESB推送 ${hisData.length} 条记录`);
        break;
      }
      case 'api': {
        logDetails.push(`调用HIS API: ${config.apiEndpoint}`);
        hisData = generateMockHISData(config.businessScenario, 10);
        logDetails.push(`[模拟] API接口返回 ${hisData.length} 条记录`);
        break;
      }
      default:
        throw new Error(`不支持的同步方案: ${config.syncMode}`);
    }

    sourceCount = hisData.length;

    // Transform data using field mapping
    const fieldMap = parseJsonConfig(config.fieldMapping);
    const transformRules = parseJsonConfig(config.transformRules);
    if (Object.keys(fieldMap).length > 0) {
      hisData = hisData.map(row => transformRow(row, fieldMap, transformRules));
      logDetails.push(`字段映射转换完成，映射规则数: ${Object.keys(fieldMap).length}`);
    }
    dataSample = hisData.slice(0, 5);

    // Write to target table
    switch (config.businessScenario) {
      case 'temperature': {
        for (const record of hisData) {
          try {
            const temperature = parseFloat(String(record.temperature || record.Temperature));
            if (isNaN(temperature)) { skippedCount++; continue; }
            const { isAbnormal, isFever, feverLevel } = calculateFeverLevel(temperature);
            const id = cuid();
            db.run(`INSERT INTO TemperatureRecord
              (id, patientId, patientName, gender, age, dept, bedNo, visitId, temperature, measureRoute,
               measureTime, nurseName, hisSource, isAbnormal, isFever, feverLevel, syncStatus, syncTime)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              id,
              record.patientId || record.PatientID || `P${Date.now()}`,
              record.patientName || record.PatientName || '未知',
              record.gender || record.Gender || null,
              record.age || record.Age || null,
              record.dept || record.DeptName || '内科',
              record.bedNo || record.BedNo || null,
              record.visitId || record.VisitID || null,
              temperature,
              record.measureRoute || record.MeasureRoute || '腋下',
              record.measureTime || record.MeasureTime || new Date().toISOString(),
              record.nurseName || record.NurseName || null,
              record.hisSource || record.DataSource || 'HIS自动推送',
              isAbnormal, isFever, feverLevel,
              '已同步', new Date().toISOString()
            );
            targetCount++;
            if (isFever && config.autoWarning === 1) {
              const symptomId = cuid();
              db.run(`INSERT INTO SymptomSurveillance
                (id, dept, patientId, patientName, gender, age, temperature, symptomGroup, symptomDetail,
                 onsetDate, reporter, alertTriggered, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                symptomId,
                record.dept || record.DeptName || '内科',
                record.patientId || record.PatientID,
                record.patientName || record.PatientName || '未知',
                record.gender || record.Gender || null,
                record.age || record.Age || null,
                temperature, '发热',
                `体温${temperature}℃，${feverLevel}，HIS体温监测自动上报`,
                record.measureTime || record.MeasureTime || new Date().toISOString(),
                'HIS系统自动', 1, '待核实'
              );
              const warningId = cuid();
              db.run(`INSERT INTO WarningRecord
                (id, patientId, patientName, dept, warningType, warningLevel, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                warningId,
                record.patientId || record.PatientID,
                record.patientName || record.PatientName || '未知',
                record.dept || record.DeptName || '内科',
                '病例预警',
                temperature >= 39.0 ? '高' : '中',
                `患者${record.patientName || record.PatientName}(${record.dept || record.DeptName})体温${temperature}℃，${feverLevel}`,
                '待处理'
              );
              db.run('UPDATE TemperatureRecord SET autoReported=1, symptomSurveillanceId=?, warningTriggered=1, warningId=? WHERE id=?',
                symptomId, warningId, id);
              warningCount++;
            }
          } catch (e: any) {
            errorCount++;
            logDetails.push(`写入体温记录失败: ${e.message}`);
          }
        }
        break;
      }
      case 'micro_lab': {
        for (const record of hisData) {
          try {
            const id = cuid();
            const isMDRO = record.isMDRO || record.IsMDRO || 0;
            db.run(`INSERT INTO MicroLabResult
              (id, testId, patientId, patientName, visitId, orderNo, dept, bedNo, specimenType,
               specimenNo, collectTime, receiveTime, reportTime, reportItemName, reportItemCode,
               resultValue, resultText, isAbnormal, isMDRO, mdroType, organismName, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              id,
              record.testId || record.TestID || null,
              record.patientId || record.PatientID || `P${Date.now()}`,
              record.patientName || record.PatientName || '未知',
              record.visitId || record.VisitID || null,
              record.orderNo || record.OrderNo || null,
              record.dept || record.DeptName || null,
              record.bedNo || record.BedNo || null,
              record.specimenType || record.SpecimenType || '未知',
              record.specimenNo || record.SpecimenNo || null,
              record.collectTime || record.CollectTime || null,
              record.receiveTime || record.ReceiveTime || null,
              record.reportTime || record.ReportTime || null,
              record.reportItemName || record.ReportItemName || '未知',
              record.reportItemCode || record.ReportItemCode || null,
              record.resultValue || record.ResultValue || null,
              record.resultText || record.ResultText || null,
              record.isAbnormal || record.IsAbnormal || 0,
              isMDRO,
              record.mdroType || record.MDROType || null,
              record.organismName || record.OrganismName || null,
              '已审核'
            );
            targetCount++;
          } catch (e: any) {
            errorCount++;
            logDetails.push(`写入微生物检验记录失败: ${e.message}`);
          }
        }
        break;
      }
      default: {
        logDetails.push(`业务场景 ${config.businessScenario} 暂不支持自动写入，仅记录数据`);
        targetCount = sourceCount;
      }
    }

    logDetails.push(`同步完成: 源${sourceCount}条, 写入${targetCount}条, 跳过${skippedCount}条, 错误${errorCount}条, 触发预警${warningCount}条`);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const status = errorCount === 0 ? '成功' : (targetCount > 0 ? '部分成功' : '失败');

    db.run(`UPDATE HisSyncLog SET endTime=?, duration=?, status=?, sourceCount=?, targetCount=?,
      skippedCount=?, errorCount=?, warningCount=?, dataSample=?, logDetail=? WHERE id=?`,
      endTime.toISOString(), duration, status, sourceCount, targetCount,
      skippedCount, errorCount, warningCount,
      JSON.stringify(dataSample), logDetails.join('\n'), logId
    );

    db.run(`UPDATE HisSyncConfig SET lastSyncTime=?, lastSyncStatus=?, lastSyncCount=?,
      lastSyncError=?, totalSyncCount=totalSyncCount+?, totalFailCount=totalFailCount+? WHERE id=?`,
      endTime.toISOString(), status, targetCount,
      errorCount > 0 ? `${errorCount}条记录同步失败` : null,
      targetCount, errorCount > 0 ? 1 : 0, configId
    );

    return {
      id: logId, configId, configName: config.name, syncMode: config.syncMode,
      businessScenario: config.businessScenario, status, sourceCount, targetCount,
      skippedCount, errorCount, warningCount, duration, dataSample,
    };
  } catch (error: any) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    db.run(`UPDATE HisSyncLog SET endTime=?, duration=?, status=?, errorDetail=?, logDetail=? WHERE id=?`,
      endTime.toISOString(), duration, '失败', error.message,
      `[${startTime.toISOString()}] 开始执行\n[${endTime.toISOString()}] 执行失败: ${error.message}`, logId
    );
    db.run(`UPDATE HisSyncConfig SET lastSyncStatus='失败', lastSyncError=?, totalFailCount=totalFailCount+1 WHERE id=?`,
      error.message, configId
    );
    return { id: logId, configId, status: '失败', error: error.message, duration };
  }
}

// ============================================================================
// Seed data
// ============================================================================
function seedData() {
  const db = getDb();
  const existing = db.query('SELECT COUNT(*) as count FROM HisSyncConfig').get() as any;
  if (existing.count > 0) {
    return { message: '种子数据已存在，跳过', count: existing.count };
  }

  const now = new Date().toISOString();

  const configs = [
    {
      name: '体温数据直连同步', syncMode: 'direct', businessScenario: 'temperature',
      hisDbType: 'mssql', hisHost: '192.168.1.100', hisPort: '1433', hisDatabase: 'HIS_Nursing',
      hisUsername: 'sa', hisPassword: '******', hisTableName: 'V_Temperature_Record',
      fieldMapping: JSON.stringify({
        patientId: 'PatientID', patientName: 'PatientName', gender: 'Gender', age: 'Age',
        dept: 'DeptName', bedNo: 'BedNo', visitId: 'VisitID', temperature: 'Temperature',
        measureRoute: 'MeasureRoute', measureTime: 'MeasureTime', nurseName: 'NurseName', hisSource: 'DataSource',
      }),
      transformRules: JSON.stringify({ measureTime: { type: 'date_format' }, temperature: { type: 'number' } }),
      incrementalField: 'CreateTime', syncInterval: 300, batchSize: 500,
      enabled: 1, autoWarning: 1, connectionStatus: '未测试',
      description: '直连HIS护理系统SQL Server数据库，定时拉取患者体温数据，自动识别发热并触发预警',
    },
    {
      name: '微生物检验LIS同步', syncMode: 'direct', businessScenario: 'micro_lab',
      hisDbType: 'mssql', hisHost: '192.168.1.101', hisPort: '1433', hisDatabase: 'LIS_Lab',
      hisUsername: 'sa', hisPassword: '******', hisTableName: 'Lab_Result_Master',
      fieldMapping: JSON.stringify({
        testId: 'TestID', patientId: 'PatientID', patientName: 'PatientName',
        visitId: 'VisitID', orderNo: 'OrderNo', dept: 'DeptName', bedNo: 'BedNo',
        specimenType: 'SpecimenType', specimenNo: 'SpecimenNo',
        collectTime: 'CollectTime', receiveTime: 'ReceiveTime', reportTime: 'ReportTime',
        reportItemName: 'ReportItemName', reportItemCode: 'ReportItemCode',
        resultValue: 'ResultValue', resultText: 'ResultText',
        isAbnormal: 'IsAbnormal', isMDRO: 'IsMDRO', mdroType: 'MDROType', organismName: 'OrganismName',
      }),
      incrementalField: 'CreateTime', syncInterval: 600, batchSize: 500,
      enabled: 1, autoWarning: 1, connectionStatus: '未测试',
      description: '直连LIS检验系统SQL Server，定时同步微生物检验结果，自动识别MDRO',
    },
    {
      name: '传染病检验ESB推送', syncMode: 'esb', businessScenario: 'infectious_lab',
      hisDbType: 'mssql',
      esbEndpoint: 'http://esb.hospital.local/api/v1/lab-result/push',
      esbAuthConfig: JSON.stringify({ type: 'bearer', token: 'esb_token_xxx' }),
      fieldMapping: JSON.stringify({
        hisTestCode: 'TestCode', subItemNo: 'SubItemNo', patientId: 'PatientID',
        patientName: 'PatientName', dept: 'DeptName', resultValue: 'ResultValue',
        isPositive: 'IsPositive', reportTime: 'ReportTime',
      }),
      syncInterval: 0, batchSize: 200,
      enabled: 1, autoWarning: 1, connectionStatus: '未测试',
      description: '通过医院ESB企业服务总线接收传染病检验结果推送，自动识别阳性结果并触发预警',
    },
    {
      name: '患者信息API同步', syncMode: 'api', businessScenario: 'patient_info',
      hisDbType: 'mssql',
      apiEndpoint: 'http://his-api.hospital.local/api/v1/patients',
      apiAuthType: 'bearer',
      apiAuthConfig: JSON.stringify({ type: 'bearer', token: 'api_token_xxx' }),
      fieldMapping: JSON.stringify({
        patientId: 'PatientID', patientName: 'PatientName', gender: 'Gender', age: 'Age',
        dept: 'DeptName', bedNo: 'BedNo', admissionDate: 'AdmissionDate',
      }),
      syncInterval: 3600, batchSize: 1000,
      enabled: 0, autoWarning: 0, connectionStatus: '未测试',
      description: '通过HIS REST API接口同步患者基本信息，用于更新住院患者列表',
    },
    {
      name: '体温同步表方案', syncMode: 'sync_table', businessScenario: 'temperature',
      hisDbType: 'mssql', hisHost: '192.168.1.100', hisPort: '1433', hisDatabase: 'HIS_Nursing',
      hisUsername: 'sync_user', hisPassword: '******',
      syncTableName: 'Sync_Temperature_To_Infection',
      fieldMapping: JSON.stringify({
        patientId: 'PatientID', patientName: 'PatientName', gender: 'Gender', age: 'Age',
        dept: 'DeptName', bedNo: 'BedNo', visitId: 'VisitID', temperature: 'Temperature',
        measureRoute: 'MeasureRoute', measureTime: 'MeasureTime', nurseName: 'NurseName', hisSource: 'DataSource',
      }),
      incrementalField: 'SyncID', syncInterval: 300, batchSize: 500,
      enabled: 1, autoWarning: 1, connectionStatus: '未测试',
      description: 'HIS护理系统将体温数据写入专用同步表Sync_Temperature_To_Infection，本系统定时读取并标记已同步记录',
    },
  ];

  for (const c of configs) {
    const id = cuid();
    db.run(`INSERT INTO HisSyncConfig
      (id, name, syncMode, businessScenario, hisDbType, hisHost, hisPort, hisDatabase,
       hisUsername, hisPassword, hisTableName, syncTableName,
       esbEndpoint, esbAuthConfig, apiEndpoint, apiAuthType, apiAuthConfig,
       fieldMapping, transformRules, incrementalField, syncInterval, batchSize,
       enabled, autoWarning, connectionStatus, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, c.name, c.syncMode, c.businessScenario, c.hisDbType, c.hisHost || null, c.hisPort || null, c.hisDatabase || null,
      c.hisUsername || null, c.hisPassword || null, c.hisTableName || null, c.syncTableName || null,
      c.esbEndpoint || null, c.esbAuthConfig || null, c.apiEndpoint || null, c.apiAuthType || null, c.apiAuthConfig || null,
      c.fieldMapping, c.transformRules || null, c.incrementalField || null, c.syncInterval, c.batchSize,
      c.enabled, c.autoWarning, c.connectionStatus, c.description, now, now
    );
  }

  return { message: '种子数据创建成功', count: configs.length };
}

// ============================================================================
// HTTP Server
// ============================================================================
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const db = getDb();

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const json = (data: any, status = 200) => Response.json(data, { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    try {
      // GET /api/his-sync/configs
      if (path === '/api/his-sync/configs' && method === 'GET') {
        const configs = db.query('SELECT * FROM HisSyncConfig ORDER BY createdAt DESC').all();
        const masked = configs.map((c: any) => ({ ...c, hisPassword: c.hisPassword ? '******' : null }));
        return json({ data: masked });
      }

      // POST /api/his-sync/configs
      if (path === '/api/his-sync/configs' && method === 'POST') {
        const body = await req.json();
        const id = cuid();
        const now = new Date().toISOString();
        db.run(`INSERT INTO HisSyncConfig
          (id, name, syncMode, businessScenario, hisDbType, hisHost, hisPort, hisDatabase,
           hisUsername, hisPassword, hisOptions, hisTableName, syncTableName,
           esbEndpoint, esbAuthConfig, apiEndpoint, apiAuthType, apiAuthConfig,
           syncQuery, fieldMapping, transformRules, incrementalField, syncInterval, batchSize,
           enabled, autoWarning, connectionStatus, description, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, body.name, body.syncMode, body.businessScenario, body.hisDbType || 'mssql',
          body.hisHost || null, body.hisPort || null, body.hisDatabase || null,
          body.hisUsername || null, body.hisPassword || null, body.hisOptions || null,
          body.hisTableName || null, body.syncTableName || null,
          body.esbEndpoint || null, body.esbAuthConfig || null,
          body.apiEndpoint || null, body.apiAuthType || null, body.apiAuthConfig || null,
          body.syncQuery || null, body.fieldMapping || null, body.transformRules || null,
          body.incrementalField || null, body.syncInterval || 300, body.batchSize || 500,
          body.enabled ?? 1, body.autoWarning ?? 1, '未测试',
          body.description || null, now, now
        );
        const created = db.query('SELECT * FROM HisSyncConfig WHERE id = ?').get(id);
        return json({ data: created });
      }

      // PUT /api/his-sync/configs/:id
      const putMatch = path.match(/^\/api\/his-sync\/configs\/([^/]+)$/);
      if (putMatch && method === 'PUT') {
        const id = putMatch[1];
        const body = await req.json();
        const now = new Date().toISOString();

        // Whitelist allowed column names to prevent SQL injection
        const allowedColumns = [
          'name', 'syncMode', 'businessScenario', 'hisDbType', 'hisHost', 'hisPort',
          'hisDatabase', 'hisUsername', 'hisPassword', 'hisOptions', 'hisTableName',
          'syncTableName', 'esbEndpoint', 'esbAuthConfig', 'apiEndpoint', 'apiAuthType',
          'apiAuthConfig', 'syncQuery', 'fieldMapping', 'transformRules',
          'incrementalField', 'syncInterval', 'batchSize', 'enabled', 'autoWarning',
          'connectionStatus', 'lastTestTime', 'lastSyncTime', 'lastSyncStatus',
          'lastSyncCount', 'lastSyncError', 'description',
        ];
        const fields = Object.keys(body).filter(k => allowedColumns.includes(k));
        if (fields.length === 0) return json({ error: '没有要更新的字段' }, 400);
        const setClauses = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => body[f]);
        values.push(now, id);
        db.run(`UPDATE HisSyncConfig SET ${setClauses}, updatedAt = ? WHERE id = ?`, ...values);
        const updated = db.query('SELECT * FROM HisSyncConfig WHERE id = ?').get(id);
        return json({ data: updated });
      }

      // DELETE /api/his-sync/configs/:id
      const deleteMatch = path.match(/^\/api\/his-sync\/configs\/([^/]+)$/);
      if (deleteMatch && method === 'DELETE') {
        const id = deleteMatch[1];
        db.run('DELETE FROM HisSyncConfig WHERE id = ?', id);
        return json({ success: true });
      }

      // POST /api/his-sync/test-connection
      if (path === '/api/his-sync/test-connection' && method === 'POST') {
        const body = await req.json();
        const configId = body.configId;
        if (configId) {
          const config = db.query('SELECT * FROM HisSyncConfig WHERE id = ?').get(configId) as any;
          if (!config) return json({ success: false, message: '配置不存在' }, 404);
          const now = new Date().toISOString();
          db.run('UPDATE HisSyncConfig SET connectionStatus=?, lastTestTime=? WHERE id=?', '连接成功', now, configId);
          return json({
            success: true,
            message: `成功连接到HIS数据库 ${config.hisHost}:${config.hisPort}/${config.hisDatabase}`,
            serverInfo: `Microsoft SQL Server 2016 (SP3) - ${config.hisHost}`,
            note: '当前为模拟模式，实际部署需安装mssql包并配置真实连接',
          });
        }
        return json({
          success: true,
          message: `模拟连接测试成功: ${body.hisHost}:${body.hisPort}/${body.hisDatabase}`,
          serverInfo: 'Microsoft SQL Server 2016 (SP3)',
          note: '当前为模拟模式',
        });
      }

      // POST /api/his-sync/execute/:id
      const execMatch = path.match(/^\/api\/his-sync\/execute\/([^/]+)$/);
      if (execMatch && method === 'POST') {
        const configId = execMatch[1];
        const result = executeSync(configId, 'manual');
        return json({ data: result });
      }

      // GET /api/his-sync/logs
      if (path === '/api/his-sync/logs' && method === 'GET') {
        const configId = url.searchParams.get('configId');
        const status = url.searchParams.get('status');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        let query = 'SELECT * FROM HisSyncLog WHERE 1=1';
        const params: any[] = [];
        if (configId) { query += ' AND configId = ?'; params.push(configId); }
        if (status) { query += ' AND status = ?'; params.push(status); }
        query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const logs = db.query(query).all(...params);
        const totalResult = db.query('SELECT COUNT(*) as total FROM HisSyncLog').get() as any;
        return json({ data: logs, total: totalResult.total });
      }

      // GET /api/his-sync/logs/:id
      const logMatch = path.match(/^\/api\/his-sync\/logs\/([^/]+)$/);
      if (logMatch && method === 'GET') {
        const id = logMatch[1];
        const log = db.query('SELECT * FROM HisSyncLog WHERE id = ?').get(id);
        if (!log) return json({ error: '日志不存在' }, 404);
        return json({ data: log });
      }

      // GET /api/his-sync/stats
      if (path === '/api/his-sync/stats' && method === 'GET') {
        const totalConfigs = (db.query('SELECT COUNT(*) as c FROM HisSyncConfig').get() as any).c;
        const enabledConfigs = (db.query('SELECT COUNT(*) as c FROM HisSyncConfig WHERE enabled=1').get() as any).c;
        const totalSyncs = (db.query('SELECT COALESCE(SUM(totalSyncCount),0) as c FROM HisSyncConfig').get() as any).c;
        const totalFails = (db.query('SELECT COALESCE(SUM(totalFailCount),0) as c FROM HisSyncConfig').get() as any).c;
        const recentLogs = db.query('SELECT * FROM HisSyncLog ORDER BY createdAt DESC LIMIT 5').all();
        const syncModeStats = db.query('SELECT syncMode, COUNT(*) as count FROM HisSyncConfig GROUP BY syncMode').all();
        const scenarioStats = db.query('SELECT businessScenario, COUNT(*) as count FROM HisSyncConfig GROUP BY businessScenario').all();
        return json({ totalConfigs, enabledConfigs, totalSyncs, totalFails, recentLogs, syncModeStats, scenarioStats });
      }

      // GET /api/health
      if (path === '/api/health' && method === 'GET') {
        const totalConfigs = (db.query('SELECT COUNT(*) as c FROM HisSyncConfig').get() as any).c;
        const enabledConfigs = (db.query('SELECT COUNT(*) as c FROM HisSyncConfig WHERE enabled=1').get() as any).c;
        return json({
          status: 'ok',
          service: 'his-sync-service',
          configured: totalConfigs > 0,
          totalConfigs,
          enabledConfigs,
          uptime: process.uptime(),
        });
      }

      // POST /api/his-sync/seed
      if (path === '/api/his-sync/seed' && method === 'POST') {
        const result = seedData();
        return json(result);
      }

      return json({ error: 'Not Found', path }, 404);
    } catch (error: any) {
      console.error('API Error:', error);
      return json({ error: error.message }, 500);
    }
  },
});

console.log(`🏥 HIS同步微服务已启动: http://localhost:${PORT}`);
console.log(`📊 同步方案: 数据库直连 | 同步表 | ESB | API`);
console.log(`🗄️  数据库: ${DB_PATH}`);
