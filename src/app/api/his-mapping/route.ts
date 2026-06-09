import { NextResponse } from 'next/server';

// Business scenario definitions
const businessScenarios = [
  { id: 'infection-case', name: '医院感染病例', module: '感染监测', hisSystem: 'HIS住院系统', priority: '高', description: '从HIS获取患者住院信息，自动填充感染病例报告表单' },
  { id: 'infectious-disease', name: '法定传染病报告', module: '传染病管理', hisSystem: 'HIS门诊/住院系统', priority: '高', description: '从HIS获取患者就诊信息，支持传染病法定报告' },
  { id: 'micro-lab', name: '微生物检验结果', module: '微生物检验', hisSystem: 'LIS检验系统', priority: '高', description: '从LIS获取微生物培养和药敏结果' },
  { id: 'environmental', name: '环境卫生监测', module: '环境监测', hisSystem: 'HIS院感系统', priority: '中', description: '环境采样检测数据的采集和管理' },
  { id: 'sterilization', name: '消毒灭菌监测', module: '消毒灭菌', hisSystem: 'HIS院感系统', priority: '中', description: '消毒灭菌过程监测数据' },
  { id: 'occupational', name: '职业暴露管理', module: '职业安全', hisSystem: 'HIS人事系统', priority: '中', description: '医护人员职业暴露事件管理' },
  { id: 'antibiotic', name: '抗菌药物使用', module: '抗菌药物', hisSystem: 'HIS医嘱系统', priority: '高', description: '抗菌药物使用数据统计和监测' },
  { id: 'hand-hygiene', name: '手卫生监测', module: '手卫生', hisSystem: 'HIS院感系统', priority: '中', description: '手卫生依从性监测数据' },
  { id: 'warning-rule', name: '预警规则配置', module: '智能预警', hisSystem: 'HIS院感系统', priority: '高', description: '基于规则引擎的智能预警系统' },
];

// Field mapping definitions for each business scenario
const fieldMappings: Record<string, Array<{
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
}>> = {
  'infection-case': [
    { systemField: 'patientId', systemLabel: '患者编号', dataType: 'String', length: 20, required: true, hisField: 'PATIENT_ID', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '住院号，非身份证号', validationRule: '非空，格式P+8位数字', consistencyRisk: 'HIS住院号与院感系统患者ID编码规则不一致' },
    { systemField: 'patientName', systemLabel: '患者姓名', dataType: 'String', length: 50, required: true, hisField: 'PATIENT_NAME', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '脱敏显示时仅显示姓+**', validationRule: '非空，2-50个字符', consistencyRisk: '姓名中可能含特殊字符，HIS与院感编码不同' },
    { systemField: 'gender', systemLabel: '性别', dataType: 'Enum', length: 4, required: true, hisField: 'SEX_CODE', hisTable: 'PAT_VISIT', transformRule: '代码转换：1→男，2→女，0→未知', specialLogic: 'HIS使用国标性别代码', validationRule: '枚举值：男/女/未知', consistencyRisk: 'HIS性别代码与院感系统枚举值映射可能不完整' },
    { systemField: 'age', systemLabel: '年龄', dataType: 'Int', length: 3, required: true, hisField: 'AGE', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '需根据入院日期动态计算，不直接取HIS存储的年龄', validationRule: '0-150之间的整数', consistencyRisk: 'HIS年龄为入院时静态值，院感需实时计算' },
    { systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: true, hisField: 'DEPT_CODE', hisTable: 'PAT_VISIT', transformRule: '代码映射：HIS科室编码→院感科室名称', specialLogic: '需要科室字典映射表，支持科室合并/拆分', validationRule: '非空，必须在科室字典中', consistencyRisk: 'HIS科室编码变更后映射表需同步更新' },
    { systemField: 'bedNo', systemLabel: '床号', dataType: 'String', length: 20, required: false, hisField: 'BED_NO', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '转科时需记录原床号', validationRule: '字母+数字格式', consistencyRisk: '转科后HIS更新床号，院感需保留感染时床号' },
    { systemField: 'admissionDate', systemLabel: '入院日期', dataType: 'DateTime', length: 20, required: true, hisField: 'ADMISSION_DATE', hisTable: 'PAT_VISIT', transformRule: '日期格式转换：YYYYMMDD→YYYY-MM-DD', specialLogic: 'HIS存储格式为YYYYMMDDHHmmss', validationRule: '有效日期，不晚于当前日期', consistencyRisk: 'HIS时区与院感系统时区不一致可能导致日期偏移' },
    { systemField: 'infectionDate', systemLabel: '感染日期', dataType: 'DateTime', length: 20, required: true, hisField: 'DIAG_DATE', hisTable: 'PAT_DIAG', transformRule: '取首次诊断日期', specialLogic: '需根据感染诊断判定，非直接取诊断日期', validationRule: '有效日期，晚于入院日期48h', consistencyRisk: 'HIS诊断日期≠感染日期，需临床判定' },
    { systemField: 'infectionSite', systemLabel: '感染部位', dataType: 'Enum', length: 30, required: true, hisField: 'DIAG_CODE', hisTable: 'PAT_DIAG', transformRule: 'ICD-10编码→感染部位映射', specialLogic: '需根据ICD编码关联感染部位字典', validationRule: '枚举值，必须为预定义部位', consistencyRisk: 'ICD编码与感染部位非一对一映射，需人工审核' },
    { systemField: 'infectionType', systemLabel: '感染类型', dataType: 'Enum', length: 20, required: true, hisField: 'DIAG_TYPE', hisTable: 'PAT_DIAG', transformRule: '代码映射：1→院内感染，2→社区感染', specialLogic: '需根据入院48h规则判定', validationRule: '枚举值：院内感染/社区感染', consistencyRisk: '48h规则判定逻辑HIS中未实现，需院感系统补充' },
    { systemField: 'pathogen', systemLabel: '病原体', dataType: 'String', length: 100, required: false, hisField: 'ORGANISM_NAME', hisTable: 'LAB_RESULT', transformRule: '微生物名称标准化映射', specialLogic: '需与LIS系统对接获取微生物培养结果', validationRule: '符合微生物命名规范', consistencyRisk: 'LIS菌名与院感菌名标准不一致（如缩写差异）' },
    { systemField: 'outcome', systemLabel: '转归', dataType: 'Enum', length: 10, required: false, hisField: 'OUTCOME_CODE', hisTable: 'PAT_VISIT', transformRule: '代码映射：1→治愈，2→好转，3→未愈，4→死亡', specialLogic: 'HIS出院转归代码映射', validationRule: '枚举值：治愈/好转/未愈/死亡', consistencyRisk: 'HIS转归与院感转归分类口径不完全一致' },
    { systemField: 'reporter', systemLabel: '报告人', dataType: 'String', length: 30, required: true, hisField: 'DOCTOR_NAME', hisTable: 'PAT_DIAG', transformRule: '取首诊医生姓名', specialLogic: '非首诊医生报告时需手动修改', validationRule: '非空', consistencyRisk: '报告人可能非首诊医生，HIS无此字段' },
    { systemField: 'status', systemLabel: '状态', dataType: 'Enum', length: 10, required: true, hisField: 'REVIEW_STATUS', hisTable: 'PAT_DIAG', transformRule: '代码映射：0→待审核，1→已确认，2→已排除', specialLogic: '院感审核状态与HIS审核流程独立', validationRule: '枚举值：待审核/已确认/已排除', consistencyRisk: '院感审核与HIS审核为不同流程，状态可能冲突' },
  ],
  'infectious-disease': [
    { systemField: 'patientId', systemLabel: '患者编号', dataType: 'String', length: 20, required: true, hisField: 'PATIENT_ID', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '门诊用门诊号，住院用住院号', validationRule: '非空', consistencyRisk: '门诊与住院编号规则不同，需统一处理' },
    { systemField: 'patientName', systemLabel: '患者姓名', dataType: 'String', length: 50, required: true, hisField: 'PATIENT_NAME', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '传染病报告需全名，不脱敏', validationRule: '非空，2-50个字符', consistencyRisk: '传染病报告需实名，与其他模块脱敏规则冲突' },
    { systemField: 'idCard', systemLabel: '身份证号', dataType: 'String', length: 18, required: true, hisField: 'ID_CARD_NO', hisTable: 'PAT_INFO', transformRule: '直接映射', specialLogic: '法定传染病报告必须项', validationRule: '18位身份证号格式校验', consistencyRisk: 'HIS中身份证号可能缺失或格式不规范' },
    { systemField: 'phone', systemLabel: '联系电话', dataType: 'String', length: 20, required: true, hisField: 'PHONE_NO', hisTable: 'PAT_INFO', transformRule: '直接映射', specialLogic: '需确保可联系到患者', validationRule: '11位手机号或区号+座机号', consistencyRisk: 'HIS电话可能为旧号或无效号码' },
    { systemField: 'address', systemLabel: '现住址', dataType: 'String', length: 200, required: true, hisField: 'ADDRESS', hisTable: 'PAT_INFO', transformRule: '地址标准化处理', specialLogic: '需精确到门牌号，与户籍地址可能不同', validationRule: '非空，详细地址', consistencyRisk: 'HIS地址数据可能不完整或不规范' },
    { systemField: 'diseaseName', systemLabel: '病种名称', dataType: 'String', length: 50, required: true, hisField: 'DIAG_NAME', hisTable: 'PAT_DIAG', transformRule: 'HIS诊断名称→法定传染病标准名称', specialLogic: '需匹配传染病目录，支持ICD-10编码', validationRule: '必须在法定传染病目录中', consistencyRisk: 'HIS诊断名称与法定传染病名称表述差异' },
    { systemField: 'diseaseCode', systemLabel: '病种编码', dataType: 'String', length: 20, required: true, hisField: 'DIAG_CODE', hisTable: 'PAT_DIAG', transformRule: 'ICD-10编码映射', specialLogic: '需对应传染病分类（甲/乙/丙类）', validationRule: '有效ICD-10编码', consistencyRisk: 'ICD编码版本差异（ICD-10 vs ICD-11）' },
    { systemField: 'diseaseCategory', systemLabel: '传染病分类', dataType: 'Enum', length: 10, required: true, hisField: 'DIAG_CODE', hisTable: 'PAT_DIAG', transformRule: 'ICD编码→甲/乙/丙类映射', specialLogic: '根据病种编码自动判定分类', validationRule: '枚举值：甲类/乙类/丙类', consistencyRisk: '同一病种可能跨分类（如新冠乙类甲管）' },
    { systemField: 'onsetDate', systemLabel: '发病日期', dataType: 'DateTime', length: 20, required: true, hisField: 'SYMPTOM_ONSET', hisTable: 'PAT_VISIT', transformRule: '日期格式转换', specialLogic: 'HIS可能无此字段，需门诊病历提取', validationRule: '有效日期，不晚于诊断日期', consistencyRisk: 'HIS中发病日期字段经常为空' },
    { systemField: 'diagnosisDate', systemLabel: '诊断日期', dataType: 'DateTime', length: 20, required: true, hisField: 'DIAG_DATE', hisTable: 'PAT_DIAG', transformRule: '日期格式转换', specialLogic: '取首次诊断日期', validationRule: '有效日期', consistencyRisk: '首次诊断日期可能非传染病确诊日期' },
    { systemField: 'reportDate', systemLabel: '报告日期', dataType: 'DateTime', length: 20, required: true, hisField: 'REPORT_DATE', hisTable: 'NOTIFI_DISEASE', transformRule: '直接映射', specialLogic: '甲类2小时内、乙类24小时内上报', validationRule: '不超过法定时限', consistencyRisk: 'HIS报告时间≠实际上报CDC时间' },
    { systemField: 'reportType', systemLabel: '报告类型', dataType: 'Enum', length: 10, required: true, hisField: 'REPORT_TYPE', hisTable: 'NOTIFI_DISEASE', transformRule: '代码映射：1→初次，2→订正，3→删除', specialLogic: '订正报告需关联原报告', validationRule: '枚举值', consistencyRisk: '订正报告关联逻辑HIS中实现不完善' },
    { systemField: 'infectionSource', systemLabel: '感染来源', dataType: 'String', length: 100, required: false, hisField: 'INFECT_SOURCE', hisTable: 'NOTIFI_DISEASE', transformRule: '直接映射', specialLogic: 'HIS中该字段通常需手动填写', validationRule: '可选', consistencyRisk: 'HIS感染来源字段经常缺失' },
    { systemField: 'clinicalDiagnosis', systemLabel: '临床诊断', dataType: 'String', length: 200, required: true, hisField: 'CLINICAL_DIAG', hisTable: 'PAT_DIAG', transformRule: '直接映射', specialLogic: '需包含分型信息', validationRule: '非空', consistencyRisk: 'HIS诊断可能不完整，缺少分型' },
    { systemField: 'labResult', systemLabel: '实验室结果', dataType: 'String', length: 500, required: false, hisField: 'LAB_RESULT_TEXT', hisTable: 'LAB_RESULT', transformRule: 'LIS文本结果提取', specialLogic: '需从LIS系统获取', validationRule: '可选', consistencyRisk: 'LIS结果为结构化+文本混合，解析困难' },
    { systemField: 'severity', systemLabel: '严重程度', dataType: 'Enum', length: 10, required: true, hisField: 'SEVERITY_CODE', hisTable: 'PAT_DIAG', transformRule: '代码映射：1→轻症，2→普通，3→重症，4→危重症', specialLogic: '需根据临床指标判定', validationRule: '枚举值', consistencyRisk: 'HIS中严重程度判定标准与传染病分类标准不同' },
    { systemField: 'isolationType', systemLabel: '隔离类型', dataType: 'Enum', length: 20, required: false, hisField: 'ISOLATION_TYPE', hisTable: 'PAT_VISIT', transformRule: '代码映射', specialLogic: '根据病种自动推荐隔离类型', validationRule: '枚举值', consistencyRisk: 'HIS隔离类型与传染病防治法要求可能不完全对应' },
    { systemField: 'reportToCDC', systemLabel: '是否上报CDC', dataType: 'Enum', length: 4, required: true, hisField: 'CDC_REPORT_FLAG', hisTable: 'NOTIFI_DISEASE', transformRule: '0→否，1→是', specialLogic: '甲类必须上报，乙类按需上报', validationRule: '布尔值', consistencyRisk: 'HIS上报标志与实际上报状态可能不同步' },
  ],
  'micro-lab': [
    { systemField: 'testId', systemLabel: '检验编号', dataType: 'String', length: 30, required: true, hisField: 'TEST_ID', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: 'LIS唯一标识', validationRule: '非空，唯一', consistencyRisk: 'LIS检验编号与院感编号编码规则不同' },
    { systemField: 'patientId', systemLabel: '患者编号', dataType: 'String', length: 20, required: true, hisField: 'PATIENT_ID', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: '通过检验申请单关联患者', validationRule: '非空', consistencyRisk: 'LIS患者ID与HIS患者ID需通过就诊号关联' },
    { systemField: 'patientName', systemLabel: '患者姓名', dataType: 'String', length: 50, required: true, hisField: 'PATIENT_NAME', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: 'LIS中姓名可能为入院时旧名' },
    { systemField: 'visitId', systemLabel: '就诊号', dataType: 'String', length: 30, required: true, hisField: 'VISIT_ID', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: '门诊/住院就诊号', validationRule: '非空', consistencyRisk: '门诊与住院就诊号格式不同' },
    { systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: true, hisField: 'ORDER_DEPT', hisTable: 'LAB_ORDER', transformRule: '代码映射', specialLogic: '取开单科室，非采样科室', validationRule: '非空', consistencyRisk: '开单科室≠患者所在科室，需关联住院信息' },
    { systemField: 'specimenType', systemLabel: '标本类型', dataType: 'Enum', length: 20, required: true, hisField: 'SPECIMEN_TYPE', hisTable: 'LAB_SPECIMEN', transformRule: 'LIS标本代码→标准标本类型', specialLogic: '需标本类型字典映射', validationRule: '枚举值', consistencyRisk: 'LIS标本类型编码与院感标准不一致' },
    { systemField: 'specimenNo', systemLabel: '标本编号', dataType: 'String', length: 30, required: true, hisField: 'SPECIMEN_ID', hisTable: 'LAB_SPECIMEN', transformRule: '直接映射', specialLogic: '', validationRule: '非空，唯一', consistencyRisk: '标本编号在LIS中的唯一性需确认' },
    { systemField: 'collectTime', systemLabel: '采集时间', dataType: 'DateTime', length: 20, required: true, hisField: 'COLLECT_TIME', hisTable: 'LAB_SPECIMEN', transformRule: '时间格式转换', specialLogic: '精确到分钟', validationRule: '有效日期时间', consistencyRisk: 'LIS采集时间可能缺失，用送检时间代替' },
    { systemField: 'reportTime', systemLabel: '报告时间', dataType: 'DateTime', length: 20, required: true, hisField: 'REPORT_TIME', hisTable: 'LAB_RESULT', transformRule: '时间格式转换', specialLogic: '取审核报告时间', validationRule: '有效日期时间，晚于采集时间', consistencyRisk: '初步报告与最终报告时间需区分' },
    { systemField: 'reportItemName', systemLabel: '检验项目', dataType: 'String', length: 100, required: true, hisField: 'ITEM_NAME', hisTable: 'LAB_RESULT', transformRule: '直接映射', specialLogic: '需匹配微生物培养项目', validationRule: '非空', consistencyRisk: 'LIS项目名称可能有别名' },
    { systemField: 'resultValue', systemLabel: '结果值', dataType: 'String', length: 100, required: true, hisField: 'RESULT_VALUE', hisTable: 'LAB_RESULT', transformRule: '直接映射', specialLogic: '数值型结果需转数值，文本型原样保留', validationRule: '非空', consistencyRisk: 'LIS结果值格式不统一（含单位、参考值等）' },
    { systemField: 'isAbnormal', systemLabel: '是否异常', dataType: 'Enum', length: 4, required: true, hisField: 'ABNORMAL_FLAG', hisTable: 'LAB_RESULT', transformRule: '代码转换：H→异常，N→正常', specialLogic: '需根据参考范围二次判定', validationRule: '布尔值', consistencyRisk: 'LIS异常标志与院感判定标准可能不同' },
    { systemField: 'isMDRO', systemLabel: '是否多重耐药', dataType: 'Enum', length: 4, required: false, hisField: 'MDRO_FLAG', hisTable: 'LAB_RESULT', transformRule: 'LIS标记→院感MDRO判定', specialLogic: '需根据药敏结果综合判定', validationRule: '布尔值', consistencyRisk: 'LIS MDRO标记可能不准确，需院感二次确认' },
    { systemField: 'mdroType', systemLabel: '耐药菌类型', dataType: 'Enum', length: 20, required: false, hisField: 'MDRO_TYPE', hisTable: 'LAB_RESULT', transformRule: '代码映射：CRAB/MRSA/CRKP/VRE/CRPA', specialLogic: '根据菌名+药敏结果自动判定', validationRule: '枚举值', consistencyRisk: '耐药菌分类标准更新后映射需同步' },
    { systemField: 'organismName', systemLabel: '菌名', dataType: 'String', length: 100, required: false, hisField: 'ORGANISM_NAME', hisTable: 'LAB_CULTURE', transformRule: '菌名标准化', specialLogic: '需匹配院感菌名字典', validationRule: '符合微生物命名规范', consistencyRisk: 'LIS菌名含亚型信息，院感可能仅需到种水平' },
    { systemField: 'antibioticResult', systemLabel: '药敏结果', dataType: 'String', length: 2000, required: false, hisField: 'AST_RESULT', hisTable: 'LAB_AST', transformRule: '结构化解析：抗生素+MIC/R+S/I', specialLogic: 'JSON格式存储，含多种抗生素结果', validationRule: 'JSON格式校验', consistencyRisk: 'LIS药敏结果格式复杂，解析逻辑需持续维护' },
  ],
  'environmental': [
    { systemField: 'dept', systemLabel: '监测科室', dataType: 'String', length: 50, required: true, hisField: 'DEPT_CODE', hisTable: 'DEPT_DICT', transformRule: '代码映射', specialLogic: '科室字典映射', validationRule: '非空，在科室字典中', consistencyRisk: 'HIS科室编码与院感科室对应关系' },
    { systemField: 'samplePoint', systemLabel: '采样点', dataType: 'String', length: 50, required: true, hisField: 'SAMPLE_LOCATION', hisTable: 'ENV_SAMPLE', transformRule: '直接映射', specialLogic: '需关联科室-采样点字典', validationRule: '非空', consistencyRisk: '采样点命名规范HIS与院感可能不同' },
    { systemField: 'sampleType', systemLabel: '标本类型', dataType: 'Enum', length: 20, required: true, hisField: 'SAMPLE_TYPE', hisTable: 'ENV_SAMPLE', transformRule: '代码映射：1→空气，2→物体表面，3→医务人员手', specialLogic: '不同类型合格标准不同', validationRule: '枚举值', consistencyRisk: '标本类型分类口径可能不完全对应' },
    { systemField: 'sampleDate', systemLabel: '采样日期', dataType: 'DateTime', length: 20, required: true, hisField: 'SAMPLE_DATE', hisTable: 'ENV_SAMPLE', transformRule: '日期格式转换', specialLogic: '', validationRule: '有效日期', consistencyRisk: 'HIS采样日期格式可能不一致' },
    { systemField: 'sampler', systemLabel: '采样人', dataType: 'String', length: 30, required: true, hisField: 'SAMPLER_NAME', hisTable: 'ENV_SAMPLE', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: 'HIS可能无采样人字段' },
    { systemField: 'result', systemLabel: '检测结果', dataType: 'Enum', length: 10, required: true, hisField: 'RESULT_CODE', hisTable: 'ENV_RESULT', transformRule: '代码映射：0→合格，1→不合格', specialLogic: '根据菌落数与标准限值比较', validationRule: '枚举值', consistencyRisk: 'HIS结果代码与院感判定标准需对齐' },
    { systemField: 'colonyCount', systemLabel: '菌落数(CFU)', dataType: 'Float', length: 10, required: true, hisField: 'COLONY_COUNT', hisTable: 'ENV_RESULT', transformRule: '直接映射', specialLogic: '需统一单位为CFU/cm²或CFU/皿', validationRule: '非负数值', consistencyRisk: 'HIS中菌落数单位可能不统一' },
    { systemField: 'standardLimit', systemLabel: '标准限值', dataType: 'Float', length: 10, required: true, hisField: 'STANDARD_VALUE', hisTable: 'ENV_STANDARD', transformRule: '根据标本类型关联标准', specialLogic: '不同类型不同限值', validationRule: '非负数值', consistencyRisk: '标准限值可能随法规更新变化' },
    { systemField: 'reviewer', systemLabel: '审核人', dataType: 'String', length: 30, required: false, hisField: 'REVIEWER_NAME', hisTable: 'ENV_RESULT', transformRule: '直接映射', specialLogic: '', validationRule: '可选', consistencyRisk: 'HIS中审核人与院感审核流程可能独立' },
    { systemField: 'reviewStatus', systemLabel: '审核状态', dataType: 'Enum', length: 10, required: true, hisField: 'REVIEW_STATUS', hisTable: 'ENV_RESULT', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: '审核流程HIS与院感独立运行' },
  ],
  'sterilization': [
    { systemField: 'batchNo', systemLabel: '灭菌批次号', dataType: 'String', length: 30, required: true, hisField: 'BATCH_NO', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '', validationRule: '非空，唯一', consistencyRisk: 'HIS批次号编码规则需确认唯一性' },
    { systemField: 'sterilizer', systemLabel: '灭菌设备', dataType: 'String', length: 50, required: true, hisField: 'DEVICE_NAME', hisTable: 'STER_DEVICE', transformRule: '设备编码→名称映射', specialLogic: '', validationRule: '非空', consistencyRisk: '设备编码与名称映射需维护' },
    { systemField: 'method', systemLabel: '灭菌方法', dataType: 'Enum', length: 20, required: true, hisField: 'METHOD_CODE', hisTable: 'STER_RECORD', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: 'HIS灭菌方法分类可能不完全覆盖' },
    { systemField: 'temperature', systemLabel: '灭菌温度(℃)', dataType: 'Float', length: 6, required: false, hisField: 'TEMPERATURE', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '高压蒸汽灭菌时必填', validationRule: '≥100℃（高压蒸汽）', consistencyRisk: 'HIS温度单位可能不一致（℃/℉）' },
    { systemField: 'pressure', systemLabel: '灭菌压力(MPa)', dataType: 'Float', length: 6, required: false, hisField: 'PRESSURE', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '高压蒸汽灭菌时必填', validationRule: '0.1-0.3 MPa', consistencyRisk: '压力单位可能不一致（MPa/kPa）' },
    { systemField: 'duration', systemLabel: '灭菌时长(min)', dataType: 'Float', length: 6, required: true, hisField: 'DURATION', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '', validationRule: '正数', consistencyRisk: 'HIS时长单位可能为秒需转换' },
    { systemField: 'operator', systemLabel: '操作人', dataType: 'String', length: 30, required: true, hisField: 'OPERATOR_NAME', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: '' },
    { systemField: 'sterilizeDate', systemLabel: '灭菌日期', dataType: 'DateTime', length: 20, required: true, hisField: 'STER_DATE', hisTable: 'STER_RECORD', transformRule: '日期格式转换', specialLogic: '', validationRule: '有效日期', consistencyRisk: '' },
    { systemField: 'bioResult', systemLabel: '生物监测结果', dataType: 'Enum', length: 10, required: true, hisField: 'BIO_RESULT', hisTable: 'STER_RESULT', transformRule: '代码映射：P→合格，N→不合格', specialLogic: '', validationRule: '枚举值', consistencyRisk: 'HIS生物监测代码与院感系统不一致' },
    { systemField: 'chemResult', systemLabel: '化学监测结果', dataType: 'Enum', length: 10, required: true, hisField: 'CHEM_RESULT', hisTable: 'STER_RESULT', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: '' },
    { systemField: 'status', systemLabel: '综合结果', dataType: 'Enum', length: 10, required: true, hisField: 'OVERALL_RESULT', hisTable: 'STER_RESULT', transformRule: '综合判定：生物+化学均合格→合格', specialLogic: '', validationRule: '枚举值', consistencyRisk: '综合判定逻辑需与HIS对齐' },
  ],
  'occupational': [
    { systemField: 'staffName', systemLabel: '暴露人员姓名', dataType: 'String', length: 30, required: true, hisField: 'STAFF_NAME', hisTable: 'STAFF_INFO', transformRule: '直接映射', specialLogic: '从HIS人事系统获取', validationRule: '非空', consistencyRisk: 'HIS人事系统与院感系统人员编码不同' },
    { systemField: 'staffDept', systemLabel: '所在科室', dataType: 'String', length: 50, required: true, hisField: 'DEPT_CODE', hisTable: 'STAFF_INFO', transformRule: '代码映射', specialLogic: '', validationRule: '非空，在科室字典中', consistencyRisk: '人员科室变更后HIS更新，院感需保留暴露时科室' },
    { systemField: 'exposureType', systemLabel: '暴露类型', dataType: 'Enum', length: 20, required: true, hisField: 'EXPOSURE_TYPE', hisTable: 'OCC_EXPOSURE', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: 'HIS暴露类型分类可能不够细' },
    { systemField: 'exposureSource', systemLabel: '暴露源', dataType: 'String', length: 50, required: true, hisField: 'SOURCE_PATIENT_ID', hisTable: 'OCC_EXPOSURE', transformRule: '患者ID→患者姓名映射', specialLogic: '需关联患者信息', validationRule: '非空', consistencyRisk: '暴露源患者信息需从HIS住院系统关联' },
    { systemField: 'exposurePart', systemLabel: '暴露部位', dataType: 'String', length: 50, required: true, hisField: 'EXPOSURE_PART', hisTable: 'OCC_EXPOSURE', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: '' },
    { systemField: 'exposureDate', systemLabel: '暴露日期', dataType: 'DateTime', length: 20, required: true, hisField: 'EXPOSURE_DATE', hisTable: 'OCC_EXPOSURE', transformRule: '日期格式转换', specialLogic: '', validationRule: '有效日期', consistencyRisk: '' },
    { systemField: 'emergencyAction', systemLabel: '应急处理', dataType: 'String', length: 200, required: true, hisField: 'EMERGENCY_ACTION', hisTable: 'OCC_EXPOSURE', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: '' },
    { systemField: 'riskLevel', systemLabel: '风险等级', dataType: 'Enum', length: 10, required: true, hisField: 'RISK_LEVEL', hisTable: 'OCC_EXPOSURE', transformRule: '代码映射：1→高，2→中，3→低', specialLogic: '', validationRule: '枚举值', consistencyRisk: '风险评估标准HIS与院感可能不同' },
    { systemField: 'followUpPlan', systemLabel: '随访计划', dataType: 'String', length: 200, required: false, hisField: 'FOLLOWUP_PLAN', hisTable: 'OCC_EXPOSURE', transformRule: '直接映射', specialLogic: '', validationRule: '可选', consistencyRisk: '' },
    { systemField: 'status', systemLabel: '状态', dataType: 'Enum', length: 10, required: true, hisField: 'STATUS', hisTable: 'OCC_EXPOSURE', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: '' },
  ],
  'antibiotic': [
    { systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: true, hisField: 'DEPT_CODE', hisTable: 'ORDER_INFO', transformRule: '代码映射', specialLogic: '取患者所在科室', validationRule: '非空', consistencyRisk: '开单科室≠患者科室，需关联住院信息' },
    { systemField: 'month', systemLabel: '统计月份', dataType: 'String', length: 7, required: true, hisField: 'ORDER_DATE', hisTable: 'ORDER_INFO', transformRule: '截取年月：YYYY-MM', specialLogic: '按月汇总统计', validationRule: 'YYYY-MM格式', consistencyRisk: '' },
    { systemField: 'totalPatients', systemLabel: '出院人数', dataType: 'Int', length: 6, required: true, hisField: 'DISCHARGE_COUNT', hisTable: 'PAT_STAT', transformRule: '直接映射', specialLogic: '需排除非抗菌药物相关出院', validationRule: '正整数', consistencyRisk: 'HIS出院人数统计口径可能不同' },
    { systemField: 'antibioticPatients', systemLabel: '使用抗菌药物人数', dataType: 'Int', length: 6, required: true, hisField: 'AB_USE_COUNT', hisTable: 'PAT_STAT', transformRule: '去重计数', specialLogic: '同一患者多次使用计1人', validationRule: '正整数，≤totalPatients', consistencyRisk: 'HIS去重逻辑与院感统计口径可能不同' },
    { systemField: 'usageRate', systemLabel: '使用率(%)', dataType: 'Float', length: 6, required: true, hisField: 'AB_USE_RATE', hisTable: 'PAT_STAT', transformRule: '直接映射或计算', specialLogic: 'antibioticPatients/totalPatients*100', validationRule: '0-100之间的数值', consistencyRisk: 'HIS计算口径与院感统计口径需对齐' },
    { systemField: 'ddd', systemLabel: 'DDD值', dataType: 'Float', length: 8, required: false, hisField: 'DDD_VALUE', hisTable: 'ORDER_INFO', transformRule: '累计DDD值', specialLogic: '需按WHO ATC/DDD索引计算', validationRule: '非负数值', consistencyRisk: 'DDD计算需参考WHO标准，HIS可能未实现' },
    { systemField: 'preOpProphylaxisRate', systemLabel: '术前预防用药率(%)', dataType: 'Float', length: 6, required: false, hisField: 'PREOP_AB_RATE', hisTable: 'SURG_INFO', transformRule: '计算或直接映射', specialLogic: '仅外科科室', validationRule: '0-100之间的数值', consistencyRisk: '术前预防用药定义HIS与院感可能不同' },
    { systemField: 'preOpTimingRate', systemLabel: '术前0.5-2h给药率(%)', dataType: 'Float', length: 6, required: false, hisField: 'PREOP_TIMING_RATE', hisTable: 'SURG_INFO', transformRule: '计算或直接映射', specialLogic: '需关联手术时间和给药时间', validationRule: '0-100之间的数值', consistencyRisk: '给药时间精确到分钟HIS可能未记录' },
    { systemField: 'postOp24hStopRate', systemLabel: '术后24h停药率(%)', dataType: 'Float', length: 6, required: false, hisField: 'POSTOP_STOP_RATE', hisTable: 'SURG_INFO', transformRule: '计算或直接映射', specialLogic: '', validationRule: '0-100之间的数值', consistencyRisk: '术后停药时间判定逻辑复杂' },
    { systemField: 'pathogenSendRate', systemLabel: '病原学送检率(%)', dataType: 'Float', length: 6, required: false, hisField: 'CULTURE_SEND_RATE', hisTable: 'PAT_STAT', transformRule: '计算或直接映射', specialLogic: '使用抗菌药物前送检率', validationRule: '0-100之间的数值', consistencyRisk: '送检率计算需关联医嘱和检验申请' },
  ],
  'hand-hygiene': [
    { systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: true, hisField: 'DEPT_CODE', hisTable: 'DEPT_DICT', transformRule: '代码映射', specialLogic: '', validationRule: '非空，在科室字典中', consistencyRisk: '' },
    { systemField: 'month', systemLabel: '统计月份', dataType: 'String', length: 7, required: true, hisField: 'STAT_MONTH', hisTable: 'HH_STAT', transformRule: '截取年月', specialLogic: '', validationRule: 'YYYY-MM格式', consistencyRisk: '' },
    { systemField: 'totalOpportunities', systemLabel: '应洗手次数', dataType: 'Int', length: 6, required: true, hisField: 'TOTAL_OPP', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: '手工观察记录', validationRule: '正整数', consistencyRisk: 'HIS无此字段，需手工录入' },
    { systemField: 'compliantActions', systemLabel: '实际洗手次数', dataType: 'Int', length: 6, required: true, hisField: 'COMPLIANT_COUNT', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: '', validationRule: '正整数，≤totalOpportunities', consistencyRisk: '' },
    { systemField: 'complianceRate', systemLabel: '依从率(%)', dataType: 'Float', length: 6, required: true, hisField: 'COMPLIANCE_RATE', hisTable: 'HH_STAT', transformRule: '直接映射或计算', specialLogic: '', validationRule: '0-100之间的数值', consistencyRisk: '' },
    { systemField: 'beforeContact', systemLabel: '接触患者前(%)', dataType: 'Float', length: 6, required: false, hisField: 'BEFORE_CONTACT_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之一', validationRule: '0-100之间的数值', consistencyRisk: '' },
    { systemField: 'beforeAseptic', systemLabel: '无菌操作前(%)', dataType: 'Float', length: 6, required: false, hisField: 'BEFORE_ASEPTIC_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之二', validationRule: '0-100之间的数值', consistencyRisk: '' },
    { systemField: 'afterContact', systemLabel: '接触患者后(%)', dataType: 'Float', length: 6, required: false, hisField: 'AFTER_CONTACT_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之三', validationRule: '0-100之间的数值', consistencyRisk: '' },
    { systemField: 'afterFluid', systemLabel: '体液暴露后(%)', dataType: 'Float', length: 6, required: false, hisField: 'AFTER_FLUID_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之四', validationRule: '0-100之间的数值', consistencyRisk: '' },
    { systemField: 'afterSurrounding', systemLabel: '接触周围环境后(%)', dataType: 'Float', length: 6, required: false, hisField: 'AFTER_ENV_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之五', validationRule: '0-100之间的数值', consistencyRisk: '' },
  ],
  'warning-rule': [
    { systemField: 'name', systemLabel: '规则名称', dataType: 'String', length: 100, required: true, hisField: 'RULE_NAME', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '非空，2-100字符', consistencyRisk: '规则名称在不同系统中可能重复' },
    { systemField: 'code', systemLabel: '规则编码', dataType: 'String', length: 50, required: true, hisField: 'RULE_CODE', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '需保证唯一性', validationRule: '非空，唯一，字母+数字+下划线', consistencyRisk: 'HIS规则编码与院感编码规则需统一' },
    { systemField: 'category', systemLabel: '规则分类', dataType: 'Enum', length: 20, required: true, hisField: 'RULE_CATEGORY', hisTable: 'WARNING_RULE', transformRule: '代码映射', specialLogic: '感染监测/传染病管理/环境监测/职业安全/症状监测/多重耐药菌', validationRule: '枚举值', consistencyRisk: 'HIS分类体系与院感分类可能不完全对应' },
    { systemField: 'ruleType', systemLabel: '规则类型', dataType: 'Enum', length: 20, required: true, hisField: 'RULE_TYPE', hisTable: 'WARNING_RULE', transformRule: '代码映射', specialLogic: '阈值/趋势/聚集/组合/定时', validationRule: '枚举值', consistencyRisk: '' },
    { systemField: 'conditions', systemLabel: '触发条件', dataType: 'String', length: 2000, required: true, hisField: 'RULE_CONDITIONS', hisTable: 'WARNING_RULE', transformRule: 'JSON格式解析', specialLogic: '条件表达式需解析为可执行逻辑', validationRule: '有效JSON格式', consistencyRisk: '条件表达式格式HIS与院感可能不同' },
    { systemField: 'thresholdValue', systemLabel: '阈值', dataType: 'Float', length: 10, required: false, hisField: 'THRESHOLD_VALUE', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '数值', consistencyRisk: '' },
    { systemField: 'timeWindow', systemLabel: '时间窗口(分钟)', dataType: 'Int', length: 6, required: false, hisField: 'TIME_WINDOW', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '正整数', consistencyRisk: '' },
    { systemField: 'warningLevel', systemLabel: '预警级别', dataType: 'Enum', length: 10, required: true, hisField: 'WARNING_LEVEL', hisTable: 'WARNING_RULE', transformRule: '代码映射：1→低，2→中，3→高', specialLogic: '', validationRule: '枚举值', consistencyRisk: '预警级别标准HIS与院感需统一' },
    { systemField: 'enabled', systemLabel: '是否启用', dataType: 'Enum', length: 4, required: true, hisField: 'ENABLED', hisTable: 'WARNING_RULE', transformRule: '0→否，1→是', specialLogic: '', validationRule: '布尔值', consistencyRisk: '' },
    { systemField: 'cooldownMinutes', systemLabel: '冷却时间(分钟)', dataType: 'Int', length: 6, required: false, hisField: 'COOLDOWN_MINUTES', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '非负整数', consistencyRisk: '' },
    { systemField: 'priority', systemLabel: '优先级', dataType: 'Int', length: 3, required: true, hisField: 'PRIORITY', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '数字越大优先级越高', validationRule: '0-999', consistencyRisk: '' },
    { systemField: 'targetDepts', systemLabel: '目标科室', dataType: 'String', length: 500, required: false, hisField: 'TARGET_DEPTS', hisTable: 'WARNING_RULE', transformRule: '科室编码列表解析', specialLogic: 'JSON数组格式', validationRule: '有效JSON数组', consistencyRisk: '科室编码映射需与科室字典同步' },
  ],
};

// Data format conversion rules
const conversionRules = [
  // Date format conversions
  { category: '日期格式转换', sourceFormat: 'YYYYMMDD', targetFormat: 'YYYY-MM-DD', conversionFunction: 'formatDate(str, "YYYYMMDD", "YYYY-MM-DD")', example: '20240115 → 2024-01-15' },
  { category: '日期格式转换', sourceFormat: 'YYYYMMDDHHmmss', targetFormat: 'YYYY-MM-DD HH:mm:ss', conversionFunction: 'formatDateTime(str, "YYYYMMDDHHmmss", "YYYY-MM-DD HH:mm:ss")', example: '20240115143025 → 2024-01-15 14:30:25' },
  { category: '日期格式转换', sourceFormat: 'Unix时间戳(ms)', targetFormat: 'YYYY-MM-DD HH:mm:ss', conversionFunction: 'new Date(timestamp).toISOString()', example: '1705305025000 → 2024-01-15 06:30:25' },
  { category: '日期格式转换', sourceFormat: 'YYYY/MM/DD', targetFormat: 'YYYY-MM-DD', conversionFunction: 'str.replace(/\\//g, "-")', example: '2024/01/15 → 2024-01-15' },
  // Code mapping
  { category: '代码映射', sourceFormat: 'HIS性别代码(1/2/0/9)', targetFormat: '系统枚举(男/女/未知)', conversionFunction: 'mapCode(sexCode, SEX_MAP)', example: '1 → 男, 2 → 女' },
  { category: '代码映射', sourceFormat: 'HIS科室编码', targetFormat: '系统科室名称', conversionFunction: 'mapCode(deptCode, DEPT_MAP)', example: 'D001 → ICU' },
  { category: '代码映射', sourceFormat: 'ICD-10诊断编码', targetFormat: '感染部位枚举', conversionFunction: 'mapCode(icdCode, INFECTION_SITE_MAP)', example: 'J18.9 → 呼吸道' },
  { category: '代码映射', sourceFormat: 'HIS标本类型代码', targetFormat: '系统标本枚举', conversionFunction: 'mapCode(specimenCode, SPECIMEN_MAP)', example: 'S01 → 血液, S02 → 尿液' },
  { category: '代码映射', sourceFormat: 'HIS结果代码(P/N/H)', targetFormat: '系统结果(阳性/阴性/异常)', conversionFunction: 'mapCode(resultCode, RESULT_MAP)', example: 'P → 阳性, N → 阴性' },
  // Data type conversion
  { category: '数据类型转换', sourceFormat: 'String → Int', targetFormat: '整数类型', conversionFunction: 'parseInt(str, 10)', example: '"42" → 42' },
  { category: '数据类型转换', sourceFormat: 'String → Float', targetFormat: '浮点类型', conversionFunction: 'parseFloat(str)', example: '"3.14" → 3.14' },
  { category: '数据类型转换', sourceFormat: 'String → DateTime', targetFormat: '日期时间类型', conversionFunction: 'parseDate(str, format)', example: '"20240115" → Date(2024-01-15)' },
  { category: '数据类型转换', sourceFormat: 'Float → String(百分比)', targetFormat: '百分比字符串', conversionFunction: '(val * 100).toFixed(2) + "%"', example: '0.85 → "85.00%"' },
  { category: '数据类型转换', sourceFormat: 'String → Boolean', targetFormat: '布尔类型', conversionFunction: 'str === "1" || str.toLowerCase() === "true"', example: '"1" → true, "0" → false' },
  // Value range mapping
  { category: '值域映射', sourceFormat: '体温数值(℃)', targetFormat: '体温分级', conversionFunction: 'mapTemperature(temp)', example: '37.3 → 低热, 38.0 → 中度发热, 39.0 → 高热' },
  { category: '值域映射', sourceFormat: '白细胞计数(×10⁹/L)', targetFormat: '异常标志', conversionFunction: 'wbc < 4 || wbc > 10 ? "异常" : "正常"', example: '3.5 → 异常, 12.0 → 异常, 7.0 → 正常' },
  { category: '值域映射', sourceFormat: '药敏MIC值', targetFormat: '敏感度(S/I/R)', conversionFunction: 'interpretMIC(mic, antibiotic, breakpoint)', example: '≤2 → S, 4 → I, ≥8 → R' },
  { category: '值域映射', sourceFormat: '菌落数(CFU)', targetFormat: '合格判定', conversionFunction: 'colony <= standard ? "合格" : "不合格"', example: '3 CFU/皿 → 合格(限值4), 6 CFU/皿 → 不合格' },
];

// Validation rules summary
const validationRules = [
  // Infection case validation
  { form: '感染病例报告', field: 'patientId', ruleType: 'required', ruleDescription: '患者编号不能为空', errorMessage: '请输入患者编号', severity: '高' },
  { form: '感染病例报告', field: 'patientName', ruleType: 'required', ruleDescription: '患者姓名不能为空', errorMessage: '请输入患者姓名', severity: '高' },
  { form: '感染病例报告', field: 'infectionDate', ruleType: 'cross-field', ruleDescription: '感染日期应晚于入院日期48小时', errorMessage: '感染日期必须晚于入院日期48小时以上', severity: '高' },
  { form: '感染病例报告', field: 'infectionSite', ruleType: 'required', ruleDescription: '感染部位不能为空', errorMessage: '请选择感染部位', severity: '高' },
  { form: '感染病例报告', field: 'age', ruleType: 'range', ruleDescription: '年龄应在0-150之间', errorMessage: '年龄超出合理范围', severity: '中' },
  { form: '感染病例报告', field: 'pathogen', ruleType: 'business', ruleDescription: '如选择病原体，需关联LIS检验结果', errorMessage: '病原体信息需与LIS结果一致', severity: '中' },
  // Infectious disease validation
  { form: '法定传染病报告', field: 'idCard', ruleType: 'format', ruleDescription: '身份证号18位格式校验', errorMessage: '身份证号格式不正确', severity: '高' },
  { form: '法定传染病报告', field: 'phone', ruleType: 'format', ruleDescription: '手机号11位格式校验', errorMessage: '手机号格式不正确', severity: '中' },
  { form: '法定传染病报告', field: 'reportDate', ruleType: 'business', ruleDescription: '甲类2小时内上报，乙类24小时内上报', errorMessage: '超过法定上报时限', severity: '高' },
  { form: '法定传染病报告', field: 'diseaseName', ruleType: 'required', ruleDescription: '病种名称不能为空且须在法定目录中', errorMessage: '请选择法定传染病病种', severity: '高' },
  { form: '法定传染病报告', field: 'diagnosisDate', ruleType: 'cross-field', ruleDescription: '诊断日期不早于发病日期', errorMessage: '诊断日期不能早于发病日期', severity: '中' },
  // Micro lab validation
  { form: '微生物检验', field: 'specimenNo', ruleType: 'required', ruleDescription: '标本编号不能为空且唯一', errorMessage: '标本编号重复或为空', severity: '高' },
  { form: '微生物检验', field: 'reportTime', ruleType: 'cross-field', ruleDescription: '报告时间晚于采集时间', errorMessage: '报告时间不能早于采集时间', severity: '中' },
  { form: '微生物检验', field: 'isMDRO', ruleType: 'business', ruleDescription: 'MDRO标记需与药敏结果一致', errorMessage: 'MDRO标记与药敏结果矛盾', severity: '高' },
  // Environmental monitor validation
  { form: '环境卫生监测', field: 'colonyCount', ruleType: 'range', ruleDescription: '菌落数≥0', errorMessage: '菌落数不能为负数', severity: '中' },
  { form: '环境卫生监测', field: 'result', ruleType: 'business', ruleDescription: '结果需与菌落数和标准限值一致', errorMessage: '检测结果与菌落数/标准限值不一致', severity: '高' },
  // Sterilization validation
  { form: '消毒灭菌监测', field: 'temperature', ruleType: 'range', ruleDescription: '高压蒸汽温度≥100℃', errorMessage: '高压蒸汽温度不能低于100℃', severity: '高' },
  { form: '消毒灭菌监测', field: 'pressure', ruleType: 'range', ruleDescription: '高压蒸汽压力0.1-0.3MPa', errorMessage: '压力超出正常范围', severity: '高' },
  // Occupational exposure validation
  { form: '职业暴露管理', field: 'exposureDate', ruleType: 'required', ruleDescription: '暴露日期不能为空', errorMessage: '请输入暴露日期', severity: '高' },
  { form: '职业暴露管理', field: 'riskLevel', ruleType: 'business', ruleDescription: '风险等级需根据暴露类型和源患者评估', errorMessage: '请完善风险评估', severity: '中' },
  // Antibiotic validation
  { form: '抗菌药物使用', field: 'usageRate', ruleType: 'range', ruleDescription: '使用率0-100%', errorMessage: '使用率超出合理范围', severity: '中' },
  { form: '抗菌药物使用', field: 'antibioticPatients', ruleType: 'cross-field', ruleDescription: '使用人数≤出院人数', errorMessage: '使用人数不能超过出院人数', severity: '高' },
  // Hand hygiene validation
  { form: '手卫生监测', field: 'complianceRate', ruleType: 'range', ruleDescription: '依从率0-100%', errorMessage: '依从率超出合理范围', severity: '中' },
  { form: '手卫生监测', field: 'compliantActions', ruleType: 'cross-field', ruleDescription: '实际洗手次数≤应洗手次数', errorMessage: '实际洗手次数不能超过应洗手次数', severity: '高' },
  // Warning rule validation
  { form: '预警规则配置', field: 'conditions', ruleType: 'format', ruleDescription: '条件表达式需为有效JSON', errorMessage: '条件表达式JSON格式错误', severity: '高' },
  { form: '预警规则配置', field: 'code', ruleType: 'required', ruleDescription: '规则编码唯一', errorMessage: '规则编码已存在', severity: '高' },
  { form: '预警规则配置', field: 'thresholdValue', ruleType: 'range', ruleDescription: '阈值需为正数', errorMessage: '阈值必须为正数', severity: '中' },
];

// Consistency issues
const consistencyIssues = [
  { severity: '高', category: '编码映射', description: 'HIS科室编码与院感系统科室字典不一致，科室合并/拆分后映射表需同步更新', affectedFields: 'dept (所有模块)', solution: '建立统一科室主数据管理(MDM)，变更时自动推送映射表更新' },
  { severity: '高', category: '时序一致', description: 'HIS诊断日期与院感感染日期含义不同，HIS诊断日期≠感染日期', affectedFields: 'infectionDate (感染病例)', solution: '入院48h规则由院感系统判定，不直接取HIS诊断日期' },
  { severity: '高', category: '时序一致', description: 'HIS年龄为入院时静态值，院感需根据出生日期实时计算', affectedFields: 'age (感染病例/传染病)', solution: '取HIS出生日期字段，院感系统实时计算年龄' },
  { severity: '高', category: '数据缺失', description: 'HIS发病日期字段经常为空，影响传染病法定报告时效计算', affectedFields: 'onsetDate (传染病)', solution: '通过NLP提取门诊主诉中的发病时间，或由临床补充填写' },
  { severity: '高', category: '编码映射', description: 'ICD-10编码与感染部位非一对一映射，需人工审核确认', affectedFields: 'infectionSite (感染病例)', solution: '建立ICD-感染部位映射规则库，辅助人工判定' },
  { severity: '中', category: '系统关联', description: 'LIS菌名与院感菌名标准不一致（如缩写差异、亚型信息）', affectedFields: 'organismName (微生物检验)', solution: '建立菌名标准化映射表，自动匹配+人工确认' },
  { severity: '中', category: '统计口径', description: 'HIS出院人数统计口径与院感不同（是否包含转科、自动出院等）', affectedFields: 'totalPatients (抗菌药物)', solution: '统一定义出院人数口径，按院感要求过滤' },
  { severity: '中', category: '统计口径', description: '抗菌药物使用率计算口径：HIS去重逻辑与院感可能不同', affectedFields: 'usageRate, antibioticPatients (抗菌药物)', solution: '明确定义去重规则：同一患者多次使用计1人' },
  { severity: '中', category: '时序一致', description: '转科后HIS更新床号，院感需保留感染时床号', affectedFields: 'bedNo (感染病例)', solution: '感染报告创建时锁定床号快照，不随HIS更新' },
  { severity: '中', category: '数据缺失', description: 'HIS身份证号可能缺失或格式不规范，影响传染病法定报告', affectedFields: 'idCard (传染病)', solution: '门诊挂号强制采集身份证号，增加格式校验' },
  { severity: '中', category: '系统关联', description: 'LIS药敏结果格式复杂，解析逻辑需持续维护', affectedFields: 'antibioticResult (微生物检验)', solution: '与LIS约定标准结构化输出格式，定期验证解析逻辑' },
  { severity: '低', category: '编码映射', description: 'HIS性别代码与院感枚举值映射可能不完整（含未知/其他）', affectedFields: 'gender (感染病例/传染病)', solution: '映射表增加默认值处理，未知代码映射为"未知"' },
  { severity: '低', category: '单位不一致', description: 'HIS温度可能使用华氏度，需转换为摄氏度', affectedFields: 'temperature (消毒灭菌)', solution: '转换函数中增加单位检测和自动转换' },
  { severity: '低', category: '单位不一致', description: 'HIS菌落数单位可能不统一（CFU/cm² vs CFU/皿 vs CFU/m³）', affectedFields: 'colonyCount (环境卫生)', solution: '根据标本类型自动选择单位转换公式' },
  { severity: '低', category: '流程差异', description: '院感审核流程与HIS审核流程独立运行，状态可能冲突', affectedFields: 'status, reviewStatus (多模块)', solution: '明确审核流程边界，HIS审核≠院感审核' },
];

export async function GET() {
  return NextResponse.json({
    businessScenarios,
    fieldMappings,
    conversionRules,
    validationRules,
    consistencyIssues,
    summary: {
      totalScenarios: businessScenarios.length,
      highPriorityCount: businessScenarios.filter(s => s.priority === '高').length,
      mediumPriorityCount: businessScenarios.filter(s => s.priority === '中').length,
      totalFieldMappings: Object.values(fieldMappings).reduce((sum, fields) => sum + fields.length, 0),
      totalConversionRules: conversionRules.length,
      totalValidationRules: validationRules.length,
      totalConsistencyIssues: consistencyIssues.length,
      highSeverityIssues: consistencyIssues.filter(i => i.severity === '高').length,
    },
  });
}
