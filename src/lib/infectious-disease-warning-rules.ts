/**
 * 传染病阳性检验项目预警规则生成脚本
 *
 * 基于上传的传染病阳性检验项目Excel数据，自动生成预警规则。
 * 本文件导出：
 * 1. INFECTIOUS_DISEASE_TEST_ITEMS - 完整检验项目数据
 * 2. HIS_TEST_MAPPINGS - HIS检验项目映射数据
 * 3. generateInfectiousDiseaseWarningRules() - 异步函数，创建WarningRule记录
 */

import { db } from '@/lib/db';

// ============ 类型定义 ============

export interface InfectiousDiseaseTestItem {
  testItemCode: string;
  testItemName: string;
  positiveResult: string;
  diseaseName: string;
  diseaseCode: string;
  diseaseCategory: string;
  isNotifiable: number;
  reportTimeLimit?: number;
  testMethod: string;
  specimenTypes: string;
  warningLevel: string;
  riskNote?: string;
}

export interface HisTestMapping {
  hisTestCode: string;
  hisTestName: string;
  subItemNo: number;
  testItemCode: string;
  testItemName: string;
}

// ============ 20项传染病阳性检验项目数据 ============

export const INFECTIOUS_DISEASE_TEST_ITEMS: InfectiousDiseaseTestItem[] = [
  {
    testItemCode: 'jyxx2351',
    testItemName: '乙型肝炎病毒表面抗原（HBsAg）',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
    riskNote: '乙肝为乙类传染病，需24小时内报告',
  },
  {
    testItemCode: 'jyxx468',
    testItemName: '乙型肝炎表面抗原(HBsAg)',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
    riskNote: '乙肝表面抗原阳性',
  },
  {
    testItemCode: 'jyxx2136',
    testItemName: '丙型肝炎病毒抗体(Anti-HCV)',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
    riskNote: '丙肝抗体阳性，需进一步确诊',
  },
  {
    testItemCode: 'jyxx479',
    testItemName: '丙型肝炎抗体(Anti-HCV)',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
  },
  {
    testItemCode: 'jyxx1841',
    testItemName: '丙型肝炎病毒核酸(HCV RNA)测定(A)',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '核酸检测',
    specimenTypes: '血清,全血',
    warningLevel: '高',
    riskNote: 'HCV RNA阳性确认活动性感染',
  },
  {
    testItemCode: 'jyxx1464',
    testItemName: '甲型肝炎病毒抗体IgM(A)',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
    riskNote: '甲肝IgM阳性提示急性感染',
  },
  {
    testItemCode: 'jyxx841',
    testItemName: '甲型流感病毒抗原',
    positiveResult: '阳性',
    diseaseName: '流行性感冒',
    diseaseCode: 'J10-J11',
    diseaseCategory: '丙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '抗原检测',
    specimenTypes: '咽拭子,鼻拭子',
    warningLevel: '中',
    riskNote: '甲流季需关注聚集性',
  },
  {
    testItemCode: 'jyxx1410',
    testItemName: '乙型流感病毒(A)',
    positiveResult: '阳性',
    diseaseName: '流行性感冒',
    diseaseCode: 'J10-J11',
    diseaseCategory: '丙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '抗原检测',
    specimenTypes: '咽拭子,鼻拭子',
    warningLevel: '低',
  },
  {
    testItemCode: 'jyxx11874',
    testItemName: '新型冠状病毒（2019-nCoV）抗原检测',
    positiveResult: '阳性',
    diseaseName: '新型冠状病毒感染',
    diseaseCode: 'U07.1',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '抗原检测',
    specimenTypes: '咽拭子,鼻拭子',
    warningLevel: '高',
    riskNote: '新冠阳性需隔离并报告',
  },
  {
    testItemCode: 'jyxx975',
    testItemName: '梅毒螺旋体抗体(Anti-TP)',
    positiveResult: '阳性',
    diseaseName: '梅毒',
    diseaseCode: 'A50-A53',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
    riskNote: '梅毒抗体阳性需确证试验',
  },
  {
    testItemCode: 'jyxx845',
    testItemName: '梅毒甲苯胺红不加热血清试验(TRUST)',
    positiveResult: '阳性',
    diseaseName: '梅毒',
    diseaseCode: 'A50-A53',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
    riskNote: 'TRUST阳性提示活动性梅毒',
  },
  {
    testItemCode: 'jyxx3158',
    testItemName: '梅毒螺旋体特异性抗体(TPPA法)(A)',
    positiveResult: '阳性',
    diseaseName: '梅毒',
    diseaseCode: 'A50-A53',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
  },
  {
    testItemCode: 'jyxx2095',
    testItemName: '人免疫缺陷病毒抗体(HIV-Ab)',
    positiveResult: 'HIV感染待确定',
    diseaseName: '艾滋病',
    diseaseCode: 'B20-B24',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '高',
    riskNote: 'HIV初筛阳性需送确证试验',
  },
  {
    testItemCode: 'jyxx11895',
    testItemName: '沙眼衣原体抗原检测',
    positiveResult: '阳性',
    diseaseName: '沙眼衣原体感染',
    diseaseCode: 'A71',
    diseaseCategory: '其他',
    isNotifiable: 0,
    testMethod: '抗原检测',
    specimenTypes: '分泌物,尿液',
    warningLevel: '低',
  },
  {
    testItemCode: 'jyxx488',
    testItemName: '淋球菌培养',
    positiveResult: '培养出淋球菌奈瑟氏菌生长',
    diseaseName: '淋病',
    diseaseCode: 'A54',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '培养',
    specimenTypes: '分泌物',
    warningLevel: '中',
    riskNote: '淋病为乙类传染病',
  },
  {
    testItemCode: 'jyxx1833',
    testItemName: '戊型肝炎病毒抗体IgM(A)',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '中',
    riskNote: '戊肝IgM阳性提示急性感染',
  },
  {
    testItemCode: 'jyxx1834',
    testItemName: '戊型肝炎病毒抗体IgG(A)',
    positiveResult: '阳性',
    diseaseName: '病毒性肝炎',
    diseaseCode: 'B15-B19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '血清学',
    specimenTypes: '血清,全血',
    warningLevel: '低',
    riskNote: '戊肝IgG阳性提示既往感染或恢复期，需结合IgM判断',
  },
  {
    testItemCode: 'jyxx_ws_gc',
    testItemName: '淋球菌涂片检查(WS)',
    positiveResult: '找到G-双球菌',
    diseaseName: '淋病',
    diseaseCode: 'A54',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '涂片',
    specimenTypes: '分泌物',
    warningLevel: '中',
  },
  {
    testItemCode: 'jyxx_ws_tb',
    testItemName: '结核菌涂片检查—涂片找抗酸杆菌(WS)',
    positiveResult: '阳性/找到',
    diseaseName: '肺结核',
    diseaseCode: 'A15-A19',
    diseaseCategory: '乙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '涂片',
    specimenTypes: '痰液',
    warningLevel: '高',
    riskNote: '肺结核为乙类传染病，需隔离管理',
  },
  {
    testItemCode: 'jyxx_ws_rotavirus',
    testItemName: '轮状病毒抗原',
    positiveResult: '阳性',
    diseaseName: '感染性腹泻',
    diseaseCode: 'A09',
    diseaseCategory: '丙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '抗原检测',
    specimenTypes: '粪便',
    warningLevel: '低',
  },
  {
    testItemCode: 'jyxx_ws_norovirus',
    testItemName: '诺如病毒抗原',
    positiveResult: '阳性',
    diseaseName: '感染性腹泻',
    diseaseCode: 'A09',
    diseaseCategory: '丙类',
    isNotifiable: 1,
    reportTimeLimit: 24,
    testMethod: '抗原检测',
    specimenTypes: '粪便',
    warningLevel: '低',
    riskNote: '诺如病毒易引起聚集性腹泻',
  },
];

// ============ HIS检验项目映射数据 ============

export const HIS_TEST_MAPPINGS: HisTestMapping[] = [
  { hisTestCode: '1517', hisTestName: '乙肝两对半（定性）（快速乳胶法）', subItemNo: 1, testItemCode: 'jyxx2351', testItemName: '乙型肝炎病毒表面抗原（HBsAg）' },
  { hisTestCode: '1605', hisTestName: '乙型肝炎表面抗原测定(HBsAg)(各种免疫学方法)（定性）', subItemNo: 1, testItemCode: 'jyxx2351', testItemName: '乙型肝炎病毒表面抗原（HBsAg）' },
  { hisTestCode: '1606', hisTestName: '乙型肝炎表面抗原测定(HBsAg)（化学法）（定量）', subItemNo: 1, testItemCode: 'jyxx468', testItemName: '乙型肝炎表面抗原(HBsAg)' },
  { hisTestCode: '3188', hisTestName: '感染七项', subItemNo: 1, testItemCode: 'jyxx468', testItemName: '乙型肝炎表面抗原(HBsAg)' },
  { hisTestCode: '6195', hisTestName: '感染八项', subItemNo: 4, testItemCode: 'jyxx468', testItemName: '乙型肝炎表面抗原(HBsAg)' },
  { hisTestCode: '6240', hisTestName: '乙肝两对半(定量)', subItemNo: 1, testItemCode: 'jyxx468', testItemName: '乙型肝炎表面抗原(HBsAg)' },
  { hisTestCode: '6241', hisTestName: '乙肝两对半（定性）（WS）', subItemNo: 1, testItemCode: 'jyxx2351', testItemName: '乙型肝炎病毒表面抗原（HBsAg）' },
  { hisTestCode: '9197', hisTestName: '感染八项(WS)', subItemNo: 3, testItemCode: 'jyxx2351', testItemName: '乙型肝炎病毒表面抗原（HBsAg）' },
  { hisTestCode: '966', hisTestName: '丙型肝炎RNA测定-定量(高敏)(WS)', subItemNo: 2, testItemCode: 'jyxx2136', testItemName: '丙型肝炎病毒抗体(Anti-HCV)' },
  { hisTestCode: '1617', hisTestName: '丙型肝炎抗体测定(Anti-HCV)-其他免疫学方法（定性）', subItemNo: 1, testItemCode: 'jyxx2136', testItemName: '丙型肝炎病毒抗体(Anti-HCV)' },
  { hisTestCode: '3290', hisTestName: 'HIV初筛试验+HCV+梅毒(定性)(WS)', subItemNo: 3, testItemCode: 'jyxx2136', testItemName: '丙型肝炎病毒抗体(Anti-HCV)' },
  { hisTestCode: '9197', hisTestName: '感染八项(WS)', subItemNo: 1, testItemCode: 'jyxx2136', testItemName: '丙型肝炎病毒抗体(Anti-HCV)' },
  { hisTestCode: '12817', hisTestName: '丙型肝炎抗体测定(Anti-HCV)-其他免疫学方法（定性）WS', subItemNo: 1, testItemCode: 'jyxx2136', testItemName: '丙型肝炎病毒抗体(Anti-HCV)' },
  { hisTestCode: '1618', hisTestName: '丙型肝炎抗体测定(Anti-HCV)-化学发光法（定量）', subItemNo: 1, testItemCode: 'jyxx479', testItemName: '丙型肝炎抗体(Anti-HCV)' },
  { hisTestCode: '3188', hisTestName: '感染七项', subItemNo: 6, testItemCode: 'jyxx479', testItemName: '丙型肝炎抗体(Anti-HCV)' },
  { hisTestCode: '3491', hisTestName: 'HIV初筛试验+HCV+梅毒抗体(定量)(WS)', subItemNo: 3, testItemCode: 'jyxx479', testItemName: '丙型肝炎抗体(Anti-HCV)' },
  { hisTestCode: '6195', hisTestName: '感染八项', subItemNo: 4, testItemCode: 'jyxx479', testItemName: '丙型肝炎抗体(Anti-HCV)' },
  { hisTestCode: '1616', hisTestName: '丙型肝炎病毒核糖核酸扩增定量检测(WS)', subItemNo: 1, testItemCode: 'jyxx1841', testItemName: '丙型肝炎病毒核酸(HCV RNA)测定(A)' },
  { hisTestCode: '963', hisTestName: '甲型肝炎病毒抗体IgM(WS)', subItemNo: 1, testItemCode: 'jyxx1464', testItemName: '甲型肝炎病毒抗体IgM(A)' },
  { hisTestCode: '1656', hisTestName: '流感A+B抗原检测', subItemNo: 1, testItemCode: 'jyxx841', testItemName: '甲型流感病毒抗原' },
  { hisTestCode: '371', hisTestName: '呼吸道核酸12联检(WS)', subItemNo: 2, testItemCode: 'jyxx1410', testItemName: '乙型流感病毒(A)' },
  { hisTestCode: '1656', hisTestName: '流感A+B抗原检测', subItemNo: 2, testItemCode: 'jyxx1410', testItemName: '乙型流感病毒(A)' },
  { hisTestCode: '6366', hisTestName: '六项呼吸道病原体核酸检测(WS)', subItemNo: 6, testItemCode: 'jyxx1410', testItemName: '乙型流感病毒(A)' },
  { hisTestCode: '8553', hisTestName: '呼吸道核酸13联检(WS)', subItemNo: 10, testItemCode: 'jyxx1410', testItemName: '乙型流感病毒(A)' },
  { hisTestCode: '371', hisTestName: '呼吸道核酸12联检(WS)', subItemNo: 10, testItemCode: 'jyxx2661', testItemName: '新型冠状病毒' },
  { hisTestCode: '9336', hisTestName: '新型冠状病毒(2019-nCoV)抗原检测', subItemNo: 1, testItemCode: 'jyxx11874', testItemName: '新型冠状病毒（2019-nCoV）抗原检测' },
  { hisTestCode: '1640', hisTestName: '梅毒螺旋体抗体测定(Anti-TP)（化学发光法）（定量）', subItemNo: 1, testItemCode: 'jyxx975', testItemName: '梅毒螺旋体抗体(Anti-TP)' },
  { hisTestCode: '3188', hisTestName: '感染七项', subItemNo: 7, testItemCode: 'jyxx975', testItemName: '梅毒螺旋体抗体(Anti-TP)' },
  { hisTestCode: '3491', hisTestName: 'HIV初筛试验+HCV+梅毒抗体(定量)(WS)', subItemNo: 1, testItemCode: 'jyxx975', testItemName: '梅毒螺旋体抗体(Anti-TP)' },
  { hisTestCode: '6195', hisTestName: '感染八项', subItemNo: 3, testItemCode: 'jyxx975', testItemName: '梅毒螺旋体抗体(Anti-TP)' },
  { hisTestCode: '1654', hisTestName: '甲苯胺红梅毒血清学试验定性（TRUST）（定性）', subItemNo: 1, testItemCode: 'jyxx845', testItemName: '梅毒甲苯胺红不加热血清试验(TRUST)' },
  { hisTestCode: '1639', hisTestName: '梅毒螺旋体特异抗体测定(定性)', subItemNo: 1, testItemCode: 'jyxx3158', testItemName: '梅毒螺旋体特异性抗体(TPPA法)(A)' },
  { hisTestCode: '3290', hisTestName: 'HIV初筛试验+HCV+梅毒(定性)(WS)', subItemNo: 1, testItemCode: 'jyxx3158', testItemName: '梅毒螺旋体特异性抗体(TPPA法)(A)' },
  { hisTestCode: '9197', hisTestName: '感染八项(WS)', subItemNo: 8, testItemCode: 'jyxx3158', testItemName: '梅毒螺旋体特异性抗体(TPPA法)(A)' },
  { hisTestCode: '12290', hisTestName: '梅毒螺旋体特异性抗体(TPPA法)（WS)', subItemNo: 1, testItemCode: 'jyxx3158', testItemName: '梅毒螺旋体特异性抗体(TPPA法)(A)' },
  { hisTestCode: '1623', hisTestName: '人免疫缺陷病毒抗体测定(Anti-HIV)(各种免疫学法)(WS)', subItemNo: 1, testItemCode: 'jyxx2095', testItemName: '人免疫缺陷病毒抗体(HIV-Ab)' },
  { hisTestCode: '3290', hisTestName: 'HIV初筛试验+HCV+梅毒(定性)(WS)', subItemNo: 2, testItemCode: 'jyxx2095', testItemName: '人免疫缺陷病毒抗体(HIV-Ab)' },
  { hisTestCode: '9197', hisTestName: '感染八项(WS)', subItemNo: 2, testItemCode: 'jyxx2095', testItemName: '人免疫缺陷病毒抗体(HIV-Ab)' },
  { hisTestCode: '1690', hisTestName: '衣原体检查(WS)', subItemNo: 1, testItemCode: 'jyxx11895', testItemName: '沙眼衣原体抗原检测' },
  { hisTestCode: '1684', hisTestName: '淋球菌培养(WS)', subItemNo: 1, testItemCode: 'jyxx488', testItemName: '淋球菌培养' },
  { hisTestCode: '8985', hisTestName: '戊型肝炎病毒抗体IgM(WS)', subItemNo: 1, testItemCode: 'jyxx1833', testItemName: '戊型肝炎病毒抗体IgM(A)' },
  { hisTestCode: '8986', hisTestName: '戊型肝炎病毒抗体IgG(WS)', subItemNo: 1, testItemCode: 'jyxx1834', testItemName: '戊型肝炎病毒抗体IgG(A)' },
];

// ============ 预警规则定义 ============

interface WarningRuleDefinition {
  name: string;
  code: string;
  category: string;
  ruleType: string;
  description: string;
  conditionType: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  timeWindow: number;
  warningLevel: string;
  warningType: string;
  targetDiseases?: string;
  actionType: string;
  actionConfig?: string;
  cooldownMinutes: number;
  priority: number;
  isSystem: number;
  enabled: number;
  createdBy: string;
}

/**
 * 12条传染病预警规则定义
 * 基于传染病阳性检验项目数据，按病种和场景分类设计
 */
const INFECTIOUS_DISEASE_WARNING_RULES: WarningRuleDefinition[] = [
  {
    name: '传染病阳性检出通用预警',
    code: 'WR-ID-POSITIVE-DETECT',
    category: '传染病管理',
    ruleType: '阈值预警',
    description: '当任意传染病检验项目结果为阳性时触发预警，覆盖所有20项传染病阳性检验项目（乙肝、丙肝、甲肝、戊肝、甲流、乙流、新冠、梅毒、HIV、沙眼衣原体、淋球菌、肺结核、轮状病毒、诺如病毒等），确保法定传染病不漏报',
    conditionType: '大于',
    conditionField: 'idLabPositive',
    conditionOperator: 'gt',
    conditionValue: '0',
    timeWindow: 24,
    warningLevel: '中',
    warningType: '病例预警',
    targetDiseases: '病毒性肝炎,流行性感冒,新型冠状病毒感染,梅毒,艾滋病,沙眼衣原体感染,淋病,肺结核,感染性腹泻',
    actionType: 'notify',
    actionConfig: '{"notifyRoles":["infection_control","clinical_doctor"],"autoCreateCase":true,"autoReport":true}',
    cooldownMinutes: 120,
    priority: 12,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '甲类传染病即时预警',
    code: 'WR-ID-CLASS-A',
    category: '传染病管理',
    ruleType: '时效预警',
    description: '甲类传染病（霍乱、鼠疫）发现后2小时内必须上报CDC，超过时限自动升级预警，确保法定报告时效要求。当前检验项目中虽无甲类传染病检测项，但预留规则以备扩展',
    conditionType: '等于',
    conditionField: 'notifiableDisease',
    conditionOperator: 'eq',
    conditionValue: '甲类',
    timeWindow: 2,
    warningLevel: '高',
    warningType: '暴发预警',
    targetDiseases: '霍乱,鼠疫',
    actionType: 'escalate',
    actionConfig: '{"notifyRoles":["infection_control","super_admin"],"escalateTo":"CDC","autoReport":true,"urgent":true}',
    cooldownMinutes: 60,
    priority: 25,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '乙类传染病上报预警',
    code: 'WR-ID-CLASS-B',
    category: '传染病管理',
    ruleType: '时效预警',
    description: '乙类传染病（乙肝、丙肝、甲肝、戊肝、新冠、梅毒、HIV、淋病、肺结核等）发现后24小时内必须上报，超时未上报触发预警。覆盖检验项目中的乙类传染病：jyxx2351/jyxx468/jyxx2136/jyxx479/jyxx1841/jyxx1464/jyxx1833（肝炎）、jyxx11874（新冠）、jyxx975/jyxx845/jyxx3158（梅毒）、jyxx2095（HIV）、jyxx488/jyxx_ws_gc（淋病）、jyxx_ws_tb（肺结核）',
    conditionType: '时间超限',
    conditionField: 'notifiableDisease',
    conditionOperator: 'timeout',
    conditionValue: '乙类',
    timeWindow: 24,
    warningLevel: '中',
    warningType: '病例预警',
    targetDiseases: '病毒性肝炎,新型冠状病毒感染,梅毒,艾滋病,淋病,肺结核',
    actionType: 'notify',
    actionConfig: '{"notifyRoles":["infection_control"],"checkReportStatus":true,"autoRemind":true}',
    cooldownMinutes: 120,
    priority: 15,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: 'HIV初筛阳性预警',
    code: 'WR-ID-HIV',
    category: '传染病管理',
    ruleType: '阈值预警',
    description: 'HIV初筛抗体检测（jyxx2095-人免疫缺陷病毒抗体）结果为"HIV感染待确定"时触发高级别预警，需立即送确证试验并启动保密上报流程。艾滋病为乙类传染病，需24小时内报告',
    conditionType: '包含',
    conditionField: 'idLabPositive',
    conditionOperator: 'contains',
    conditionValue: 'HIV',
    timeWindow: 24,
    warningLevel: '高',
    warningType: '暴发预警',
    targetDiseases: '艾滋病',
    actionType: 'escalate',
    actionConfig: '{"notifyRoles":["infection_control"],"confidentialReport":true,"confirmTestRequired":true,"counselingRequired":true}',
    cooldownMinutes: 60,
    priority: 22,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '病毒性肝炎阳性预警',
    code: 'WR-ID-HEPATITIS',
    category: '传染病管理',
    ruleType: '阈值预警',
    description: '病毒性肝炎相关检验项目阳性时触发预警，覆盖：jyxx2351/jyxx468（乙肝表面抗原）、jyxx2136/jyxx479（丙肝抗体）、jyxx1841（丙肝RNA）、jyxx1464（甲肝IgM）、jyxx1833（戊肝IgM）。均为乙类传染病，需24小时内报告',
    conditionType: '包含',
    conditionField: 'idLabPositive',
    conditionOperator: 'contains',
    conditionValue: '肝炎',
    timeWindow: 24,
    warningLevel: '中',
    warningType: '病例预警',
    targetDiseases: '病毒性肝炎',
    actionType: 'notify',
    actionConfig: '{"notifyRoles":["infection_control"],"hepatitisType":"甲/乙/丙/戊","autoCreateCase":true}',
    cooldownMinutes: 120,
    priority: 14,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '新冠阳性检出预警',
    code: 'WR-ID-COVID',
    category: '传染病管理',
    ruleType: '阈值预警',
    description: '新型冠状病毒抗原检测（jyxx11874-2019-nCoV抗原检测）阳性时触发高级别预警，需立即隔离并上报。新冠为乙类传染病，需24小时内报告，且需启动隔离管理和接触者追踪',
    conditionType: '包含',
    conditionField: 'idLabPositive',
    conditionOperator: 'contains',
    conditionValue: '新冠',
    timeWindow: 24,
    warningLevel: '高',
    warningType: '暴发预警',
    targetDiseases: '新型冠状病毒感染',
    actionType: 'escalate',
    actionConfig: '{"notifyRoles":["infection_control","super_admin"],"isolationRequired":true,"contactTracing":true,"autoCreateCase":true}',
    cooldownMinutes: 60,
    priority: 20,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '肺结核阳性预警',
    code: 'WR-ID-TB',
    category: '传染病管理',
    ruleType: '阈值预警',
    description: '结核菌涂片检查（jyxx_ws_tb-涂片找抗酸杆菌）阳性时触发高级别预警，需启动隔离管理和转诊流程。肺结核为乙类传染病，需24小时内报告，且需呼吸道隔离',
    conditionType: '包含',
    conditionField: 'idLabPositive',
    conditionOperator: 'contains',
    conditionValue: '结核',
    timeWindow: 24,
    warningLevel: '高',
    warningType: '病例预警',
    targetDiseases: '肺结核',
    actionType: 'escalate',
    actionConfig: '{"notifyRoles":["infection_control"],"respiratoryIsolation":true,"referralRequired":true,"autoCreateCase":true}',
    cooldownMinutes: 60,
    priority: 18,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '梅毒阳性预警',
    code: 'WR-ID-SYPHILIS',
    category: '传染病管理',
    ruleType: '阈值预警',
    description: '梅毒相关检验项目阳性时触发预警，覆盖：jyxx975（梅毒螺旋体抗体Anti-TP）、jyxx845（TRUST试验）、jyxx3158（TPPA法特异性抗体）。梅毒为乙类传染病，需24小时内报告，TRUST阳性提示活动性感染',
    conditionType: '包含',
    conditionField: 'idLabPositive',
    conditionOperator: 'contains',
    conditionValue: '梅毒',
    timeWindow: 24,
    warningLevel: '中',
    warningType: '病例预警',
    targetDiseases: '梅毒',
    actionType: 'notify',
    actionConfig: '{"notifyRoles":["infection_control"],"confirmTestRequired":true,"autoCreateCase":true}',
    cooldownMinutes: 120,
    priority: 13,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '流感阳性聚集预警',
    code: 'WR-ID-FLU-CLUSTER',
    category: '传染病管理',
    ruleType: '聚集预警',
    description: '流感相关检验项目（jyxx841-甲型流感抗原、jyxx1410-乙型流感病毒）72小时内同科室≥3例阳性时触发聚集预警。流感为丙类传染病，需关注聚集性和院内交叉感染风险',
    conditionType: '大于等于',
    conditionField: 'idLabCount',
    conditionOperator: 'gte',
    conditionValue: '3',
    timeWindow: 72,
    warningLevel: '中',
    warningType: '聚集预警',
    targetDiseases: '流行性感冒',
    actionType: 'notify',
    actionConfig: '{"notifyRoles":["infection_control"],"clusterAnalysis":true,"infectionControlMeasures":true}',
    cooldownMinutes: 240,
    priority: 10,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '同科室传染病聚集预警',
    code: 'WR-ID-DEPT-CLUSTER',
    category: '传染病管理',
    ruleType: '聚集预警',
    description: '同一科室7天内（168小时）≥3例传染病阳性检出时触发高级别聚集预警，需排查院内交叉感染风险，启动流行病学调查。覆盖所有20项传染病检验项目',
    conditionType: '大于等于',
    conditionField: 'idLabCount',
    conditionOperator: 'gte',
    conditionValue: '3',
    timeWindow: 168,
    warningLevel: '高',
    warningType: '聚集预警',
    actionType: 'escalate',
    actionConfig: '{"notifyRoles":["infection_control","super_admin"],"epidemiologicalInvestigation":true,"environmentDisinfection":true}',
    cooldownMinutes: 60,
    priority: 16,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '诺如病毒聚集预警',
    code: 'WR-ID-NOROVIRUS-CLUSTER',
    category: '传染病管理',
    ruleType: '聚集预警',
    description: '诺如病毒抗原检测（jyxx_ws_norovirus）阳性时触发聚集预警，诺如病毒极易在医疗机构引起聚集性腹泻疫情，需立即加强环境和手卫生管理。感染性腹泻为丙类传染病',
    conditionType: '包含',
    conditionField: 'idLabPositive',
    conditionOperator: 'contains',
    conditionValue: '诺如',
    timeWindow: 72,
    warningLevel: '中',
    warningType: '聚集预警',
    targetDiseases: '感染性腹泻',
    actionType: 'notify',
    actionConfig: '{"notifyRoles":["infection_control"],"environmentDisinfection":true,"handHygieneAlert":true,"gastrointestinalIsolation":true}',
    cooldownMinutes: 120,
    priority: 11,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
  {
    name: '淋病阳性预警',
    code: 'WR-ID-GONORRHEA',
    category: '传染病管理',
    ruleType: '阈值预警',
    description: '淋病相关检验项目阳性时触发预警，覆盖：jyxx488（淋球菌培养-培养出淋球菌奈瑟氏菌生长）、jyxx_ws_gc（淋球菌涂片检查-找到G-双球菌）。淋病为乙类传染病，需24小时内报告',
    conditionType: '包含',
    conditionField: 'idLabPositive',
    conditionOperator: 'contains',
    conditionValue: '淋球菌',
    timeWindow: 24,
    warningLevel: '中',
    warningType: '病例预警',
    targetDiseases: '淋病',
    actionType: 'notify',
    actionConfig: '{"notifyRoles":["infection_control"],"autoCreateCase":true,"contactTracing":true}',
    cooldownMinutes: 120,
    priority: 13,
    isSystem: 1,
    enabled: 1,
    createdBy: '系统',
  },
];

// ============ 辅助函数 ============

/**
 * 从检验项目数据中提取唯一的传染病分类统计
 */
export function getDiseaseCategoryStats(): Record<string, { count: number; diseases: string[]; testItems: string[] }> {
  const stats: Record<string, { count: number; diseases: string[]; testItems: string[] }> = {};

  for (const item of INFECTIOUS_DISEASE_TEST_ITEMS) {
    if (!stats[item.diseaseCategory]) {
      stats[item.diseaseCategory] = { count: 0, diseases: [], testItems: [] };
    }
    stats[item.diseaseCategory].count++;
    if (!stats[item.diseaseCategory].diseases.includes(item.diseaseName)) {
      stats[item.diseaseCategory].diseases.push(item.diseaseName);
    }
    stats[item.diseaseCategory].testItems.push(item.testItemCode);
  }

  return stats;
}

/**
 * 从检验项目数据中提取唯一的传染病名称列表
 */
export function getUniqueDiseaseNames(): string[] {
  const diseaseSet = new Set<string>();
  for (const item of INFECTIOUS_DISEASE_TEST_ITEMS) {
    diseaseSet.add(item.diseaseName);
  }
  return Array.from(diseaseSet);
}

/**
 * 根据检验项目编码查找对应的HIS映射
 */
export function getHisMappingsByTestCode(testItemCode: string): HisTestMapping[] {
  return HIS_TEST_MAPPINGS.filter(m => m.testItemCode === testItemCode);
}

/**
 * 根据HIS检验代码查找对应的检验项目
 */
export function getTestItemByHisCode(hisTestCode: string): { mapping: HisTestMapping; testItem: InfectiousDiseaseTestItem | undefined }[] {
  const mappings = HIS_TEST_MAPPINGS.filter(m => m.hisTestCode === hisTestCode);
  return mappings.map(mapping => ({
    mapping,
    testItem: INFECTIOUS_DISEASE_TEST_ITEMS.find(t => t.testItemCode === mapping.testItemCode),
  }));
}

/**
 * 判断检验结果是否为阳性
 * 根据检验项目的阳性判定规则匹配结果值
 */
export function isPositiveResult(testItemCode: string, resultValue: string): boolean {
  const testItem = INFECTIOUS_DISEASE_TEST_ITEMS.find(t => t.testItemCode === testItemCode);
  if (!testItem) return false;

  const positivePatterns = testItem.positiveResult
    .split('/')
    .map(p => p.trim().toLowerCase());

  const lowerResult = resultValue.toLowerCase();
  return positivePatterns.some(pattern => lowerResult.includes(pattern));
}

// ============ 核心函数：生成传染病预警规则 ============

/**
 * 生成传染病阳性检验项目预警规则
 *
 * 在数据库中创建12条传染病管理相关的预警规则。
 * 如果规则已存在（按code唯一标识），则跳过创建。
 *
 * 同时可选地创建：
 * - InfectiousDiseaseTestItem 记录（20项检验项目基础数据）
 * - HisInfectiousDiseaseTestMapping 记录（HIS映射数据）
 *
 * @param options 配置选项
 * @param options.createTestItems 是否创建检验项目基础数据（默认true）
 * @param options.createHisMappings 是否创建HIS映射数据（默认true）
 * @returns 创建结果统计
 */
export async function generateInfectiousDiseaseWarningRules(options?: {
  createTestItems?: boolean;
  createHisMappings?: boolean;
}): Promise<{
  rulesCreated: number;
  rulesSkipped: number;
  testItemsCreated?: number;
  testItemsSkipped?: number;
  hisMappingsCreated?: number;
  hisMappingsSkipped?: number;
  errors: string[];
}> {
  const {
    createTestItems = true,
    createHisMappings = true,
  } = options ?? {};

  const errors: string[] = [];
  let rulesCreated = 0;
  let rulesSkipped = 0;
  let testItemsCreated = 0;
  let testItemsSkipped = 0;
  let hisMappingsCreated = 0;
  let hisMappingsSkipped = 0;

  try {
    // ========== 1. 创建检验项目基础数据 ==========
    if (createTestItems) {
      for (const item of INFECTIOUS_DISEASE_TEST_ITEMS) {
        try {
          const existing = await db.infectiousDiseaseTestItem.findUnique({
            where: { testItemCode: item.testItemCode },
          });

          if (existing) {
            testItemsSkipped++;
          } else {
            await db.infectiousDiseaseTestItem.create({
              data: {
                testItemCode: item.testItemCode,
                testItemName: item.testItemName,
                positiveResult: item.positiveResult,
                diseaseName: item.diseaseName,
                diseaseCode: item.diseaseCode,
                diseaseCategory: item.diseaseCategory,
                isNotifiable: item.isNotifiable,
                reportTimeLimit: item.reportTimeLimit ?? null,
                testMethod: item.testMethod,
                specimenTypes: item.specimenTypes,
                warningLevel: item.warningLevel,
                riskNote: item.riskNote ?? null,
                sort: INFECTIOUS_DISEASE_TEST_ITEMS.indexOf(item),
                status: 1,
              },
            });
            testItemsCreated++;
          }
        } catch (err) {
          errors.push(`创建检验项目 ${item.testItemCode} 失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // ========== 2. 创建HIS映射数据 ==========
    if (createHisMappings) {
      for (const mapping of HIS_TEST_MAPPINGS) {
        try {
          // 检查唯一约束：hisTestCode + subItemNo + testItemCode
          const existing = await db.hisInfectiousDiseaseTestMapping.findFirst({
            where: {
              hisTestCode: mapping.hisTestCode,
              subItemNo: mapping.subItemNo,
              testItemCode: mapping.testItemCode,
            },
          });

          if (existing) {
            hisMappingsSkipped++;
          } else {
            await db.hisInfectiousDiseaseTestMapping.create({
              data: {
                hisTestCode: mapping.hisTestCode,
                hisTestName: mapping.hisTestName,
                subItemNo: mapping.subItemNo,
                testItemCode: mapping.testItemCode,
                testItemName: mapping.testItemName,
                sort: HIS_TEST_MAPPINGS.indexOf(mapping),
                status: 1,
              },
            });
            hisMappingsCreated++;
          }
        } catch (err) {
          errors.push(`创建HIS映射 ${mapping.hisTestCode}/${mapping.testItemCode} 失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // ========== 3. 创建预警规则 ==========
    for (const rule of INFECTIOUS_DISEASE_WARNING_RULES) {
      try {
        const existing = await db.warningRule.findUnique({
          where: { code: rule.code },
        });

        if (existing) {
          rulesSkipped++;
        } else {
          await db.warningRule.create({
            data: {
              name: rule.name,
              code: rule.code,
              category: rule.category,
              ruleType: rule.ruleType,
              description: rule.description,
              conditionType: rule.conditionType,
              conditionField: rule.conditionField,
              conditionOperator: rule.conditionOperator,
              conditionValue: rule.conditionValue,
              timeWindow: rule.timeWindow,
              warningLevel: rule.warningLevel,
              warningType: rule.warningType,
              targetDiseases: rule.targetDiseases ?? null,
              actionType: rule.actionType,
              actionConfig: rule.actionConfig ?? null,
              cooldownMinutes: rule.cooldownMinutes,
              priority: rule.priority,
              isSystem: rule.isSystem,
              enabled: rule.enabled,
              triggerCount: 0,
              createdBy: rule.createdBy,
            },
          });
          rulesCreated++;
        }
      } catch (err) {
        errors.push(`创建预警规则 ${rule.code} 失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // ========== 4. 创建/更新传染病分类基础数据 ==========
    try {
      const diseaseNames = getUniqueDiseaseNames();
      for (const diseaseName of diseaseNames) {
        const testItem = INFECTIOUS_DISEASE_TEST_ITEMS.find(t => t.diseaseName === diseaseName);
        if (!testItem) continue;

        const existing = await db.diseaseCategory.findFirst({
          where: {
            diseaseName: diseaseName,
            category: testItem.diseaseCategory,
          },
        });

        if (!existing) {
          await db.diseaseCategory.create({
            data: {
              diseaseName: diseaseName,
              diseaseCode: testItem.diseaseCode,
              category: testItem.diseaseCategory,
              isNotifiable: testItem.isNotifiable,
              reportTimeLimit: testItem.reportTimeLimit ?? null,
              description: `${testItem.diseaseCategory}传染病 - ${diseaseName}`,
              sort: diseaseNames.indexOf(diseaseName),
              status: 1,
            },
          });
        }
      }
    } catch (err) {
      errors.push(`创建传染病分类数据失败: ${err instanceof Error ? err.message : String(err)}`);
    }

    // ========== 5. 创建HIS对接场景（传染病检验） ==========
    try {
      const existingScenario = await db.hisBusinessScenario.findUnique({
        where: { scenarioId: 'infectious-disease-lab' },
      });

      if (!existingScenario) {
        await db.hisBusinessScenario.create({
          data: {
            scenarioId: 'infectious-disease-lab',
            name: '传染病检验结果对接',
            module: '传染病管理',
            hisSystem: 'LIS检验系统',
            priority: '高',
            description: '从LIS获取传染病阳性检验结果，自动触发预警并创建传染病病例。支持20项传染病阳性检验项目的自动识别和HIS组合项目映射',
            sort: 10,
            status: 1,
          },
        });
      }
    } catch (err) {
      errors.push(`创建HIS对接场景失败: ${err instanceof Error ? err.message : String(err)}`);
    }

  } catch (err) {
    errors.push(`整体执行失败: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    rulesCreated,
    rulesSkipped,
    testItemsCreated: createTestItems ? testItemsCreated : undefined,
    testItemsSkipped: createTestItems ? testItemsSkipped : undefined,
    hisMappingsCreated: createHisMappings ? hisMappingsCreated : undefined,
    hisMappingsSkipped: createHisMappings ? hisMappingsSkipped : undefined,
    errors,
  };
}

/**
 * 清除所有传染病预警规则及相关数据（用于测试或重置）
 * 仅清除 code 以 'WR-ID-' 开头的规则
 */
export async function clearInfectiousDiseaseWarningRules(): Promise<{
  rulesDeleted: number;
  testItemsDeleted: number;
  hisMappingsDeleted: number;
  diseaseCategoriesDeleted: number;
}> {
  const ruleDeleteResult = await db.warningRule.deleteMany({
    where: { code: { startsWith: 'WR-ID-' } },
  });

  const testItemDeleteResult = await db.infectiousDiseaseTestItem.deleteMany({});
  const hisMappingDeleteResult = await db.hisInfectiousDiseaseTestMapping.deleteMany({});

  // 删除由本脚本创建的传染病分类
  const idDiseaseNames = getUniqueDiseaseNames();
  const diseaseCategoryDeleteResult = await db.diseaseCategory.deleteMany({
    where: { diseaseName: { in: idDiseaseNames } },
  });

  return {
    rulesDeleted: ruleDeleteResult.count,
    testItemsDeleted: testItemDeleteResult.count,
    hisMappingsDeleted: hisMappingDeleteResult.count,
    diseaseCategoriesDeleted: diseaseCategoryDeleteResult.count,
  };
}

/**
 * 获取传染病预警规则摘要信息（用于日志输出或调试）
 */
export function getWarningRulesSummary(): string[] {
  const lines: string[] = [];
  lines.push('=== 传染病预警规则摘要 ===');
  lines.push(`检验项目数量: ${INFECTIOUS_DISEASE_TEST_ITEMS.length}`);
  lines.push(`HIS映射数量: ${HIS_TEST_MAPPINGS.length}`);
  lines.push(`预警规则数量: ${INFECTIOUS_DISEASE_WARNING_RULES.length}`);
  lines.push('');

  const categoryStats = getDiseaseCategoryStats();
  lines.push('--- 传染病分类统计 ---');
  for (const [category, stat] of Object.entries(categoryStats)) {
    lines.push(`  ${category}: ${stat.count}项检验, ${stat.diseases.length}种疾病 (${stat.diseases.join(', ')})`);
  }
  lines.push('');

  lines.push('--- 预警规则列表 ---');
  for (const rule of INFECTIOUS_DISEASE_WARNING_RULES) {
    lines.push(`  [${rule.code}] ${rule.name} - 级别:${rule.warningLevel} 类型:${rule.warningType} 优先级:${rule.priority}`);
  }
  lines.push('');

  // 列出所有检验项目与HIS映射的对应关系
  lines.push('--- 检验项目-HIS映射统计 ---');
  for (const item of INFECTIOUS_DISEASE_TEST_ITEMS) {
    const mappings = HIS_TEST_MAPPINGS.filter(m => m.testItemCode === item.testItemCode);
    lines.push(`  ${item.testItemCode} (${item.testItemName}): ${mappings.length}个HIS映射`);
  }

  return lines;
}
