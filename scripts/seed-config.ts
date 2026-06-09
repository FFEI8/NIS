import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Seeding configuration data...');
  const existingDepts = await prisma.department.count();
  if (existingDepts > 0) { console.log('Config data already exists, skipping...'); return; }
  // Department
  const departments = [
    { code: 'ICU', name: 'ICU', type: '临床', building: '住院楼', floor: '3', bedCount: 20, headName: '王主任', phone: '8001', sort: 0 },
    { code: 'RESPIRATORY', name: '呼吸科', type: '临床', building: '住院楼', floor: '5', bedCount: 45, sort: 1 },
    { code: 'NEUROSURGERY', name: '神经外科', type: '临床', building: '住院楼', floor: '6', bedCount: 35, sort: 2 },
    { code: 'HEPATOBILIARY', name: '肝胆外科', type: '临床', building: '住院楼', floor: '4', bedCount: 30, sort: 3 },
    { code: 'ORTHOPEDICS', name: '骨科', type: '临床', building: '住院楼', floor: '7', bedCount: 40, sort: 4 },
    { code: 'ONCOLOGY', name: '肿瘤科', type: '临床', building: '住院楼', floor: '8', bedCount: 35, sort: 5 },
    { code: 'HEMATOLOGY', name: '血液科', type: '临床', building: '住院楼', floor: '9', bedCount: 25, sort: 6 },
    { code: 'NEPHROLOGY', name: '肾内科', type: '临床', building: '住院楼', floor: '5', bedCount: 30, sort: 7 },
    { code: 'CARDIOLOGY', name: '心内科', type: '临床', building: '门诊楼', floor: '3', bedCount: 40, sort: 8 },
    { code: 'GENERAL_SURGERY', name: '普外科', type: '临床', building: '住院楼', floor: '4', bedCount: 45, sort: 9 },
    { code: 'SURGERY', name: '外科', type: '临床', building: '住院楼', floor: '4', bedCount: 50, sort: 10 },
    { code: 'INTERNAL', name: '内科', type: '临床', building: '门诊楼', floor: '2', bedCount: 55, sort: 11 },
    { code: 'PEDIATRICS', name: '儿科', type: '临床', building: '门诊楼', floor: '3', bedCount: 35, sort: 12 },
    { code: 'OBSTETRICS', name: '妇产科', type: '临床', building: '住院楼', floor: '2', bedCount: 50, sort: 13 },
    { code: 'EMERGENCY', name: '急诊科', type: '临床', building: '急诊楼', floor: '1', bedCount: 15, sort: 14 },
    { code: 'INFECTION', name: '感染科', type: '临床', building: '感染楼', floor: '1', bedCount: 30, sort: 15 },
    { code: 'GASTROENTEROLOGY', name: '消化科', type: '临床', building: '门诊楼', floor: '4', bedCount: 30, sort: 16 },
    { code: 'OPERATING_ROOM', name: '手术室', type: '医技', building: '住院楼', floor: '3', sort: 17 },
    { code: 'BURNS', name: '烧伤科', type: '临床', building: '住院楼', floor: '6', bedCount: 15, sort: 22 },
    { code: 'DERMATOLOGY', name: '皮肤科', type: '临床', building: '门诊楼', floor: '5', bedCount: 10, sort: 23 },
  ];
  await prisma.department.createMany({ data: departments });
  console.log('Created ' + departments.length + ' departments');

  // DiseaseCategory
  const diseaseCategories = [
    { diseaseName: '鼠疫', diseaseCode: 'A20', category: '甲类', isNotifiable: 1, reportTimeLimit: 2, isolationType: '住院隔离', sort: 0 },
    { diseaseName: '霍乱', diseaseCode: 'A00', category: '甲类', isNotifiable: 1, reportTimeLimit: 2, isolationType: '住院隔离', sort: 1 },
    { diseaseName: '新型冠状病毒感染', diseaseCode: 'U07.1', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 2 },
    { diseaseName: '肺结核', diseaseCode: 'A15-A19', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '住院隔离', sort: 3 },
    { diseaseName: '病毒性肝炎', diseaseCode: 'B15-B19', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 4 },
    { diseaseName: '艾滋病', diseaseCode: 'B20-B24', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 5 },
    { diseaseName: '麻疹', diseaseCode: 'B05', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '住院隔离', sort: 8 },
    { diseaseName: '流行性出血热', diseaseCode: 'A98.0', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 9 },
    { diseaseName: '狂犬病', diseaseCode: 'A82', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '住院隔离', sort: 10 },
    { diseaseName: '流行性乙型脑炎', diseaseCode: 'A83.0', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 11 },
    { diseaseName: '细菌性痢疾', diseaseCode: 'A03', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 14 },
    { diseaseName: '伤寒', diseaseCode: 'A01.0', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 15 },
    { diseaseName: '猩红热', diseaseCode: 'A38', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 18 },
    { diseaseName: '布鲁氏菌病', diseaseCode: 'A23', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 19 },
    { diseaseName: '疟疾', diseaseCode: 'B50-B54', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 21 },
    { diseaseName: 'H7N9禽流感', diseaseCode: 'J09', category: '乙类', isNotifiable: 1, reportTimeLimit: 24, sort: 22 },
    { diseaseName: '流行性感冒', diseaseCode: 'J10-J11', category: '丙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '居家隔离', sort: 23 },
    { diseaseName: '流行性腮腺炎', diseaseCode: 'B26', category: '丙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '居家隔离', sort: 24 },
    { diseaseName: '手足口病', diseaseCode: 'B08.4', category: '丙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '居家隔离', sort: 31 },
    { diseaseName: '水痘', diseaseCode: 'B01', category: '丙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '居家隔离', sort: 32 },
    { diseaseName: '感染性腹泻', diseaseCode: 'A09', category: '丙类', isNotifiable: 1, reportTimeLimit: 24, sort: 33 },
  ];
  await prisma.diseaseCategory.createMany({ data: diseaseCategories });
  console.log('Created ' + diseaseCategories.length + ' disease categories');

  // DictItems - comprehensive
  const dictItems = [
    // infection_site
    ...[ ['surgical_site','手术部位','rose'], ['respiratory','呼吸道','blue'], ['urinary','泌尿道','amber'], ['bloodstream','血流','red'], ['skin_soft_tissue','皮肤软组织','emerald'], ['gastrointestinal','胃肠道','orange'], ['central_nervous','中枢神经','purple'] ].map(([code,name,color],i) => ({ category:'infection_site', code, name, color, sort:i })),
    // sample_type
    ...[ ['air','空气','slate'], ['surface','物体表面','emerald'], ['hand','医务人员手','blue'] ].map(([code,name,color],i) => ({ category:'sample_type', code, name, color, sort:i })),
    // specimen_type
    ...[ ['sputum','痰液','amber'], ['urine','尿液','yellow'], ['blood','血液','red'], ['secretion','分泌物','emerald'], ['lavage','肺泡灌洗液','blue'], ['serum','血清','purple'] ].map(([code,name,color],i) => ({ category:'specimen_type', code, name, color, sort:i })),
    // mdro_type
    ...[ ['CRAB','CRAB-鲍曼不动杆菌','rose'], ['CRKP','CRKP-肺炎克雷伯菌','orange'], ['MRSA','MRSA-金黄色葡萄球菌','purple'], ['VRE','VRE-屎肠球菌','red'], ['CRPA','CRPA-铜绿假单胞菌','teal'] ].map(([code,name,color],i) => ({ category:'mdro_type', code, name, color, sort:i })),
    // warning_level
    ...[ ['high','高','rose'], ['medium','中','amber'], ['low','低','blue'] ].map(([code,name,color],i) => ({ category:'warning_level', code, name, color, sort:i })),
    // warning_type
    ...[ ['case_warning','病例预警','amber'], ['cluster_warning','聚集预警','orange'], ['outbreak_warning','暴发预警','red'], ['environment_warning','环境预警','emerald'], ['exposure_warning','职业暴露预警','blue'], ['mdro_warning','MDRO预警','rose'] ].map(([code,name,color],i) => ({ category:'warning_type', code, name, color, sort:i })),
    // alert_level
    ...[ ['red','红色','red'], ['orange','橙色','orange'], ['yellow','黄色','amber'], ['blue','蓝色','blue'] ].map(([code,name,color],i) => ({ category:'alert_level', code, name, color, sort:i })),
    // alert_type
    ...[ ['notifiable','法定传染病预警','red'], ['cluster','聚集性疫情预警','orange'], ['symptom','症状监测预警','amber'], ['imported','输入性传染病预警','blue'] ].map(([code,name,color],i) => ({ category:'alert_type', code, name, color, sort:i })),
    // alert_source
    ...[ ['case_report','病例上报','blue'], ['symptom_monitor','症状监测','emerald'], ['system_auto','系统自动','rose'], ['manual_report','人工上报','amber'] ].map(([code,name,color],i) => ({ category:'alert_source', code, name, color, sort:i })),
    // exposure_type
    ...[ ['needle_stick','针刺伤','rose'], ['blood_fluid','血液体液暴露','red'], ['other','其他','slate'] ].map(([code,name,color],i) => ({ category:'exposure_type', code, name, color, sort:i })),
    // symptom_group
    ...[ ['fever','发热','red'], ['diarrhea','腹泻','amber'], ['rash','皮疹','rose'], ['respiratory','呼吸道','blue'], ['neurological','神经系统','purple'], ['hemorrhagic_fever','出血热','red'], ['other','其他','slate'] ].map(([code,name,color],i) => ({ category:'symptom_group', code, name, color, sort:i })),
    // infection_case_status
    ...[ ['pending','待审核','amber'], ['confirmed','已确认','emerald'], ['excluded','已排除','slate'] ].map(([code,name,color],i) => ({ category:'infection_case_status', code, name, color, sort:i })),
    // warning_status
    ...[ ['pending','待处理','amber'], ['confirmed','已确认','emerald'], ['excluded','已排除','slate'], ['handled','已处理','blue'] ].map(([code,name,color],i) => ({ category:'warning_status', code, name, color, sort:i })),
    // id_case_status
    ...[ ['pending','待审核','amber'], ['reviewed','已审核','emerald'], ['returned','退回','rose'], ['reported','已上报','blue'], ['closed','已结案','slate'] ].map(([code,name,color],i) => ({ category:'id_case_status', code, name, color, sort:i })),
    // severity
    ...[ ['mild','轻症','blue'], ['moderate','普通','emerald'], ['severe','重症','orange'], ['critical','危重症','red'] ].map(([code,name,color],i) => ({ category:'severity', code, name, color, sort:i })),
    // report_type
    ...[ ['initial','初次报告','blue'], ['revised','订正报告','amber'], ['outcome','转归报告','emerald'] ].map(([code,name,color],i) => ({ category:'report_type', code, name, color, sort:i })),
    // isolation_type
    ...[ ['home','居家隔离','blue'], ['centralized','集中隔离','amber'], ['hospital','住院隔离','red'], ['none','无需隔离','slate'] ].map(([code,name,color],i) => ({ category:'isolation_type', code, name, color, sort:i })),
    // outcome
    ...[ ['cured','治愈','emerald'], ['improved','好转','blue'], ['unhealed','未愈','amber'], ['death','死亡','red'], ['other','其他','slate'] ].map(([code,name,color],i) => ({ category:'outcome', code, name, color, sort:i })),
    // relationship
    ...[ ['family','家属','blue'], ['colleague','同事','emerald'], ['ward_mate','同病室','amber'], ['medical_staff','医护','rose'], ['other','其他','slate'] ].map(([code,name,color],i) => ({ category:'relationship', code, name, color, sort:i })),
    // contact_type
    ...[ ['close','密切接触','red'], ['general','一般接触','amber'] ].map(([code,name,color],i) => ({ category:'contact_type', code, name, color, sort:i })),
    // quarantine_type
    ...[ ['home','居家隔离','blue'], ['centralized','集中隔离','amber'], ['self_monitor','自我健康监测','emerald'], ['none','无需隔离','slate'] ].map(([code,name,color],i) => ({ category:'quarantine_type', code, name, color, sort:i })),
    // follow_up_status
    ...[ ['pending','待随访','amber'], ['following','随访中','blue'], ['released','已解除','emerald'], ['confirmed','已转确诊','red'] ].map(([code,name,color],i) => ({ category:'follow_up_status', code, name, color, sort:i })),
    // symptom_status
    ...[ ['asymptomatic','无症状','emerald'], ['symptomatic','有症状','amber'], ['diagnosed','已确诊','red'] ].map(([code,name,color],i) => ({ category:'symptom_status', code, name, color, sort:i })),
    // rule_category
    ...[ ['infection','感染监测','blue'], ['infectious_disease','传染病管理','rose'], ['environment','环境监测','emerald'], ['occupational','职业安全','amber'], ['symptom','症状监测','purple'], ['mdro','多重耐药菌','red'] ].map(([code,name,color],i) => ({ category:'rule_category', code, name, color, sort:i })),
    // rule_type
    ...[ ['threshold','阈值预警','blue'], ['trend','趋势预警','emerald'], ['cluster','聚集预警','orange'], ['timeliness','时效预警','amber'], ['composite','复合规则','rose'] ].map(([code,name,color],i) => ({ category:'rule_type', code, name, color, sort:i })),
    // condition_operator
    ...[ ['gt','大于','blue'], ['lt','小于','blue'], ['eq','等于','blue'], ['gte','大于等于','blue'], ['lte','小于等于','blue'], ['contains','包含','emerald'], ['rising','趋势上升','amber'], ['falling','趋势下降','amber'], ['timeout','时间超限','red'] ].map(([code,name,color],i) => ({ category:'condition_operator', code, name, color, sort:i })),
    // action_type
    ...[ ['notify','通知','blue'], ['escalate','升级','amber'], ['block','阻断','red'] ].map(([code,name,color],i) => ({ category:'action_type', code, name, color, sort:i })),
    // monitoring_field
    ...[ ['infection_rate','感染率','blue'], ['case_count','病例数','blue'], ['colony_count','菌落数','emerald'], ['antibiotic_usage_rate','抗菌药物使用率','amber'], ['hand_hygiene_rate','手卫生依从率','emerald'], ['exposure_count','暴露次数','red'], ['fever_count','发热人数','rose'], ['mdro_count','MDRO检出数','rose'], ['temperature','体温','red'], ['report_timeliness','报告及时率','amber'] ].map(([code,name,color],i) => ({ category:'monitoring_field', code, name, color, sort:i })),
    // gender
    ...[ ['male','男','blue'], ['female','女','rose'] ].map(([code,name,color],i) => ({ category:'gender', code, name, color, sort:i })),
    // sterilization_method
    ...[ ['autoclave','高压蒸汽','blue'], ['eo','环氧乙烷','amber'], ['plasma','等离子','emerald'] ].map(([code,name,color],i) => ({ category:'sterilization_method', code, name, color, sort:i })),
    // env_review_status
    ...[ ['pending','待审核','amber'], ['approved','已审核','emerald'], ['rejected','退回','rose'] ].map(([code,name,color],i) => ({ category:'env_review_status', code, name, color, sort:i })),
    // exposure_status
    ...[ ['reported','已上报','blue'], ['evaluating','评估中','amber'], ['following','随访中','emerald'], ['closed','已结案','slate'] ].map(([code,name,color],i) => ({ category:'exposure_status', code, name, color, sort:i })),
    // disease_alert_status
    ...[ ['pending','待处理','amber'], ['processing','处理中','blue'], ['handled','已处理','emerald'], ['closed','已关闭','slate'] ].map(([code,name,color],i) => ({ category:'disease_alert_status', code, name, color, sort:i })),
    // report_status
    ...[ ['draft','草稿','slate'], ['submitted','已提交','blue'], ['approved','已审核','emerald'] ].map(([code,name,color],i) => ({ category:'report_status', code, name, color, sort:i })),
    // report_type_report
    ...[ ['daily','日报','blue'], ['weekly','周报','emerald'], ['monthly','月报','amber'], ['quarterly','季报','orange'], ['annual','年报','rose'], ['special','专项','purple'] ].map(([code,name,color],i) => ({ category:'report_type_report', code, name, color, sort:i })),
    // test_result
    ...[ ['undetected','未检测','slate'], ['negative','阴性','emerald'], ['positive','阳性','red'] ].map(([code,name,color],i) => ({ category:'test_result', code, name, color, sort:i })),
    // symptom_surveillance_status
    ...[ ['pending','待核实','amber'], ['verified','已核实','emerald'], ['excluded','排除','slate'], ['alerted','已预警','red'] ].map(([code,name,color],i) => ({ category:'symptom_surveillance_status', code, name, color, sort:i })),
    // measure_route
    ...[ ['axillary','腋下','blue'], ['oral','口腔','emerald'], ['rectal','直肠','amber'], ['ear','耳温','rose'], ['forehead','额温','slate'] ].map(([code,name,color],i) => ({ category:'measure_route', code, name, color, sort:i })),
    // his_source
    ...[ ['his_push','HIS自动推送','blue'], ['nursing_input','护理录入','emerald'], ['device','设备采集','amber'] ].map(([code,name,color],i) => ({ category:'his_source', code, name, color, sort:i })),
    // lab_status
    ...[ ['pending','待审核','amber'], ['approved','已审核','emerald'], ['rejected','退回','rose'] ].map(([code,name,color],i) => ({ category:'lab_status', code, name, color, sort:i })),
  ];
  await prisma.dictItem.createMany({ data: dictItems });
  console.log('Created ' + dictItems.length + ' dict items');

  // SystemConfig
  const systemConfigs = [
    { configKey: 'fever_threshold', configValue: '38.0', configType: 'number', category: 'warning_config', description: '发热预警阈值(℃)' },
    { configKey: 'fever_report_level', configValue: '中度发热', configType: 'string', category: 'warning_config', description: '发热自动上报级别' },
    { configKey: 'auto_report_enabled', configValue: 'true', configType: 'boolean', category: 'warning_config', description: '是否启用发热自动上报' },
    { configKey: 'sync_interval', configValue: '300', configType: 'number', category: 'his_config', description: 'HIS数据同步间隔(秒)' },
    { configKey: 'mdro_cluster_threshold', configValue: '3', configType: 'number', category: 'warning_config', description: 'MDRO聚集预警阈值' },
    { configKey: 'mdro_cluster_window', configValue: '168', configType: 'number', category: 'warning_config', description: 'MDRO聚集时间窗口(小时)' },
    { configKey: 'target_infection_rate', configValue: '3.0', configType: 'number', category: 'target', description: '目标医院感染率(%)' },
    { configKey: 'target_antibiotic_rate', configValue: '40.0', configType: 'number', category: 'target', description: '目标抗菌药物使用率(%)' },
    { configKey: 'target_hand_hygiene_rate', configValue: '95.0', configType: 'number', category: 'target', description: '目标手卫生依从率(%)' },
    { configKey: 'target_environment_rate', configValue: '95.0', configType: 'number', category: 'target', description: '目标环境卫生合格率(%)' },
    { configKey: 'target_sterilization_rate', configValue: '100.0', configType: 'number', category: 'target', description: '目标灭菌合格率(%)' },
    { configKey: 'target_pathogen_send_rate', configValue: '80.0', configType: 'number', category: 'target', description: '目标治疗用药前送检率(%)' },
  ];
  await prisma.systemConfig.createMany({ data: systemConfigs });
  console.log('Created ' + systemConfigs.length + ' system configs');

  // MdroRuleTemplate
  const mdroTemplates = [
    { name: '鲍曼不动杆菌(CRAB)检出预警', mdroType: 'CRAB', bacteriaName: '鲍曼不动杆菌', description: '检出耐碳青霉烯类鲍曼不动杆菌(CRAB)时自动触发预警', conditionValue: '鲍曼不动杆菌', timeWindow: 24, warningLevel: '高', targetDepts: 'ICU,呼吸科,神经外科,烧伤科', cooldownMinutes: 120, priority: 10, riskNote: 'CRAB极易在ICU等重症科室引起院感暴发', sort: 0 },
    { name: '肺炎克雷伯菌(CRKP)检出预警', mdroType: 'CRKP', bacteriaName: '肺炎克雷伯菌', description: '检出耐碳青霉烯类肺炎克雷伯菌(CRKP)时自动触发预警', conditionValue: '肺炎克雷伯菌', timeWindow: 24, warningLevel: '高', targetDepts: 'ICU,呼吸科,肝胆外科,血液科', cooldownMinutes: 120, priority: 10, riskNote: 'CRKP对危重患者威胁大', sort: 1 },
    { name: '金黄色葡萄球菌(MRSA)检出预警', mdroType: 'MRSA', bacteriaName: '金黄色葡萄球菌', description: '检出耐甲氧西林金黄色葡萄球菌(MRSA)时自动触发预警', conditionValue: '金黄色葡萄球菌', timeWindow: 48, warningLevel: '中', targetDepts: 'ICU,外科,骨科,皮肤科', cooldownMinutes: 180, priority: 7, riskNote: 'MRSA在手术切口和创面感染中较常见', sort: 2 },
    { name: '屎肠球菌(VRE)检出预警', mdroType: 'VRE', bacteriaName: '屎肠球菌', description: '检出耐万古霉素屎肠球菌(VRE)时自动触发预警', conditionValue: '屎肠球菌', timeWindow: 24, warningLevel: '高', targetDepts: 'ICU,血液科,肿瘤科', cooldownMinutes: 120, priority: 8, riskNote: 'VRE对危重患者威胁大', sort: 3 },
    { name: '铜绿假单胞菌(CRPA)检出预警', mdroType: 'CRPA', bacteriaName: '铜绿假单胞菌', description: '检出耐碳青霉烯类铜绿假单胞菌(CRPA)时自动触发预警', conditionValue: '铜绿假单胞菌', timeWindow: 48, warningLevel: '中', targetDepts: 'ICU,呼吸科,烧伤科', cooldownMinutes: 180, priority: 7, riskNote: 'CRPA重点关注呼吸机和导管相关感染防控', sort: 4 },
  ];
  await prisma.mdroRuleTemplate.createMany({ data: mdroTemplates });
  console.log('Created ' + mdroTemplates.length + ' MDRO rule templates');

  // TargetMonitoringItem
  const targetItems = [
    { title: '医院感染率', description: '全院医院感染发病率监测', icon: 'Activity', targetRate: 3.0, currentRate: 2.3, category: '感染监测', sort: 0 },
    { title: '抗菌药物使用率', description: '住院患者抗菌药物使用率', icon: 'Pill', targetRate: 40.0, currentRate: 4.8, category: '抗菌药物', sort: 1 },
    { title: '手卫生依从率', description: '医务人员手卫生依从率', icon: 'HandMetal', targetRate: 95.0, currentRate: 1.2, category: '手卫生', sort: 2 },
    { title: '环境卫生合格率', description: '环境微生物监测合格率', icon: 'Leaf', targetRate: 95.0, currentRate: 8.5, category: '环境监测', sort: 3 },
    { title: '灭菌合格率', description: '灭菌效果监测合格率', icon: 'ShieldCheck', targetRate: 100.0, currentRate: 3.6, category: '灭菌监测', sort: 4 },
    { title: '治疗用药前送检率', description: '抗菌药物治疗用药前病原学送检率', icon: 'Microscope', targetRate: 80.0, currentRate: 5.1, category: '微生物检验', sort: 5 },
  ];
  await prisma.targetMonitoringItem.createMany({ data: targetItems });
  console.log('Created ' + targetItems.length + ' target monitoring items');
  console.log('Configuration data seeding complete!');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
