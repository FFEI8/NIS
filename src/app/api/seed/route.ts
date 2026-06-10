import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateInfectiousDiseaseWarningRules } from '@/lib/infectious-disease-warning-rules';

const R = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export async function POST() {
  try {
    if ((await db.user.count()) > 0) {
      return NextResponse.json({ success: true, message: '数据已存在，跳过初始化', data: { skipped: true } });
    }

    // Clean tables
    await Promise.all([
      db.userRole.deleteMany(), db.rolePermission.deleteMany(), db.roleMenu.deleteMany(),
      db.infectionCase.deleteMany(), db.warningRecord.deleteMany(), db.environmentalMonitor.deleteMany(),
      db.sterilizationMonitor.deleteMany(), db.occupationalExposure.deleteMany(), db.antibioticUsage.deleteMany(),
      db.handHygiene.deleteMany(), db.infectionReport.deleteMany(), db.contactTracing.deleteMany(),
      db.symptomSurveillance.deleteMany(), db.diseaseAlert.deleteMany(), db.infectiousDiseaseCase.deleteMany(),
      db.warningRule.deleteMany(), db.microLabResult.deleteMany(), db.warningRuleLog.deleteMany(),
      db.temperatureRecord.deleteMany(), db.hisBusinessScenario.deleteMany(), db.hisFieldMapping.deleteMany(),
      db.hisConversionRule.deleteMany(), db.hisValidationRule.deleteMany(), db.hisConsistencyIssue.deleteMany(),
      db.dictItem.deleteMany(), db.systemConfig.deleteMany(), db.targetMonitoringItem.deleteMany(),
      db.department.deleteMany(), db.diseaseCategory.deleteMany(), db.mdroRuleTemplate.deleteMany(),
      db.infectiousDiseaseLabResult.deleteMany(), db.infectiousDiseaseTestItem.deleteMany(),
      db.hisInfectiousDiseaseTestMapping.deleteMany(),
      db.user.deleteMany(), db.role.deleteMany(), db.permission.deleteMany(), db.menu.deleteMany(),
    ]);

    // Permissions
    const permissionDefs = [
      { code: 'system:user:list', name: '用户列表', type: 'menu', module: '系统管理' },
      { code: 'system:user:add', name: '新增用户', type: 'button', module: '系统管理' },
      { code: 'system:user:edit', name: '编辑用户', type: 'button', module: '系统管理' },
      { code: 'system:user:delete', name: '删除用户', type: 'button', module: '系统管理' },
      { code: 'system:role:list', name: '角色列表', type: 'menu', module: '系统管理' },
      { code: 'system:role:add', name: '新增角色', type: 'button', module: '系统管理' },
      { code: 'system:role:edit', name: '编辑角色', type: 'button', module: '系统管理' },
      { code: 'system:role:delete', name: '删除角色', type: 'button', module: '系统管理' },
      { code: 'system:menu:list', name: '菜单列表', type: 'menu', module: '系统管理' },
      { code: 'system:menu:add', name: '新增菜单', type: 'button', module: '系统管理' },
      { code: 'system:menu:edit', name: '编辑菜单', type: 'button', module: '系统管理' },
      { code: 'system:menu:delete', name: '删除菜单', type: 'button', module: '系统管理' },
      { code: 'system:permission:list', name: '权限列表', type: 'menu', module: '系统管理' },
      { code: 'system:permission:add', name: '新增权限', type: 'button', module: '系统管理' },
      { code: 'system:permission:edit', name: '编辑权限', type: 'button', module: '系统管理' },
      { code: 'system:permission:delete', name: '删除权限', type: 'button', module: '系统管理' },
      { code: 'infection:case:list', name: '感染病例列表', type: 'menu', module: '感染监测' },
      { code: 'infection:case:add', name: '新增感染病例', type: 'button', module: '感染监测' },
      { code: 'infection:case:edit', name: '编辑感染病例', type: 'button', module: '感染监测' },
      { code: 'infection:case:delete', name: '删除感染病例', type: 'button', module: '感染监测' },
      { code: 'infection:warning:list', name: '预警列表', type: 'menu', module: '感染监测' },
      { code: 'infection:warning:handle', name: '处理预警', type: 'button', module: '感染监测' },
      { code: 'infection:environment:list', name: '环境卫生列表', type: 'menu', module: '环境监测' },
      { code: 'infection:environment:add', name: '新增环境监测', type: 'button', module: '环境监测' },
      { code: 'infection:environment:review', name: '审核环境监测', type: 'button', module: '环境监测' },
      { code: 'infection:sterilization:list', name: '消毒灭菌列表', type: 'menu', module: '环境监测' },
      { code: 'infection:sterilization:add', name: '新增消毒灭菌', type: 'button', module: '环境监测' },
      { code: 'infection:exposure:list', name: '职业暴露列表', type: 'menu', module: '职业安全' },
      { code: 'infection:exposure:add', name: '新增职业暴露', type: 'button', module: '职业安全' },
      { code: 'infection:antibiotic:list', name: '抗菌药物列表', type: 'menu', module: '抗菌药物' },
      { code: 'infection:antibiotic:add', name: '新增抗菌药物', type: 'button', module: '抗菌药物' },
      { code: 'infection:handhygiene:list', name: '手卫生列表', type: 'menu', module: '职业安全' },
      { code: 'infection:handhygiene:add', name: '新增手卫生', type: 'button', module: '职业安全' },
      { code: 'infection:report:list', name: '报告列表', type: 'menu', module: '数据分析' },
      { code: 'infection:report:add', name: '新增报告', type: 'button', module: '数据分析' },
      { code: 'infection:report:edit', name: '编辑报告', type: 'button', module: '数据分析' },
      { code: 'id:case:list', name: '传染病病例列表', type: 'menu', module: '传染病管理' },
      { code: 'id:case:add', name: '新增传染病病例', type: 'button', module: '传染病管理' },
      { code: 'id:case:edit', name: '编辑传染病病例', type: 'button', module: '传染病管理' },
      { code: 'id:case:delete', name: '删除传染病病例', type: 'button', module: '传染病管理' },
      { code: 'id:case:review', name: '审核传染病病例', type: 'button', module: '传染病管理' },
      { code: 'id:case:report', name: '上报传染病病例', type: 'button', module: '传染病管理' },
      { code: 'id:contact:list', name: '接触者列表', type: 'menu', module: '传染病管理' },
      { code: 'id:contact:add', name: '新增接触者', type: 'button', module: '传染病管理' },
      { code: 'id:contact:edit', name: '编辑接触者', type: 'button', module: '传染病管理' },
      { code: 'id:contact:followup', name: '接触者随访', type: 'button', module: '传染病管理' },
      { code: 'id:symptom:list', name: '症状监测列表', type: 'menu', module: '传染病管理' },
      { code: 'id:symptom:add', name: '新增症状监测', type: 'button', module: '传染病管理' },
      { code: 'id:symptom:verify', name: '核实症状监测', type: 'button', module: '传染病管理' },
      { code: 'id:alert:list', name: '传染病预警列表', type: 'menu', module: '传染病管理' },
      { code: 'id:alert:handle', name: '处理传染病预警', type: 'button', module: '传染病管理' },
      { code: 'id:dashboard:view', name: '疫情看板查看', type: 'menu', module: '传染病管理' },
      { code: 'warning:rule:list', name: '预警规则列表', type: 'menu', module: '感染监测' },
      { code: 'warning:rule:add', name: '新增预警规则', type: 'button', module: '感染监测' },
      { code: 'warning:rule:edit', name: '编辑预警规则', type: 'button', module: '感染监测' },
      { code: 'warning:rule:delete', name: '删除预警规则', type: 'button', module: '感染监测' },
      { code: 'warning:rule:toggle', name: '启用/禁用规则', type: 'button', module: '感染监测' },
      { code: 'micro:lab:list', name: '微生物检验列表', type: 'menu', module: '感染监测' },
      { code: 'micro:lab:add', name: '新增微生物检验', type: 'button', module: '感染监测' },
      { code: 'micro:lab:import', name: '导入微生物数据', type: 'button', module: '感染监测' },
      { code: 'integration:his:view', name: 'HIS对接分析', type: 'menu', module: '系统集成' },
      { code: 'id:test-item:list', name: '检验项目列表', type: 'menu', module: '传染病管理' },
      { code: 'id:test-item:add', name: '新增检验项目', type: 'button', module: '传染病管理' },
      { code: 'id:test-item:edit', name: '编辑检验项目', type: 'button', module: '传染病管理' },
      { code: 'id:test-item:delete', name: '删除检验项目', type: 'button', module: '传染病管理' },
      { code: 'his:test-mapping:list', name: 'HIS检验映射列表', type: 'menu', module: '系统集成' },
      { code: 'his:test-mapping:add', name: '新增HIS检验映射', type: 'button', module: '系统集成' },
      { code: 'his:test-mapping:edit', name: '编辑HIS检验映射', type: 'button', module: '系统集成' },
      { code: 'his:test-mapping:delete', name: '删除HIS检验映射', type: 'button', module: '系统集成' },
    ];
    await db.permission.createMany({ data: permissionDefs.map((p, i) => ({ ...p, sort: i })) });
    const allPerms = await db.permission.findMany();

    // Menus
    const menuDefs = [
      { name: '首页', code: 'dashboard', path: '/dashboard', icon: 'LayoutDashboard', type: 'menu', sort: 0 },
      { name: '感染监测', code: 'infection-monitor', icon: 'Activity', type: 'directory', sort: 1 },
      { name: '感染病例', code: 'infection-case', path: '/infection/cases', icon: 'FileText', type: 'menu', parentCode: 'infection-monitor', sort: 0 },
      { name: '智能预警', code: 'infection-warning', path: '/infection/warnings', icon: 'AlertTriangle', type: 'menu', parentCode: 'infection-monitor', sort: 1 },
      { name: '预警规则', code: 'infection-warning-rules', path: '/infection/warning-rules', icon: 'Settings2', type: 'menu', parentCode: 'infection-monitor', sort: 2 },
      { name: '微生物检验', code: 'micro-lab-results', path: '/infection/micro-lab', icon: 'Microscope', type: 'menu', parentCode: 'infection-monitor', sort: 3 },
      { name: '目标监测', code: 'infection-target', path: '/infection/target', icon: 'Target', type: 'menu', parentCode: 'infection-monitor', sort: 4 },
      { name: '传染病管理', code: 'infectious-disease', icon: 'Biohazard', type: 'directory', sort: 2 },
      { name: '病例上报', code: 'id-case-report', path: '/infectious-disease/case-report', icon: 'Syringe', type: 'menu', parentCode: 'infectious-disease', sort: 0 },
      { name: '接触者追踪', code: 'id-contact-tracing', path: '/infectious-disease/contact-tracing', icon: 'Network', type: 'menu', parentCode: 'infectious-disease', sort: 1 },
      { name: '症状监测', code: 'id-symptom-surveillance', path: '/infectious-disease/symptom-surveillance', icon: 'Thermometer', type: 'menu', parentCode: 'infectious-disease', sort: 2 },
      { name: '疫情看板', code: 'id-epidemic-dashboard', path: '/infectious-disease/dashboard', icon: 'BarChart3', type: 'menu', parentCode: 'infectious-disease', sort: 3 },
      { name: '传染病预警', code: 'id-disease-alert', path: '/infectious-disease/alert', icon: 'AlertTriangle', type: 'menu', parentCode: 'infectious-disease', sort: 4 },
      { name: '检验项目配置', code: 'infectious-disease-test-items', path: '/infectious-disease/test-items', icon: 'FlaskConical', type: 'menu', parentCode: 'infectious-disease', sort: 5 },
      { name: '数据分析', code: 'data-analysis', icon: 'BarChart3', type: 'directory', sort: 3 },
      { name: '统计分析', code: 'data-statistics', path: '/data/statistics', icon: 'PieChart', type: 'menu', parentCode: 'data-analysis', sort: 0 },
      { name: '感染报告', code: 'data-report', path: '/data/reports', icon: 'FileSpreadsheet', type: 'menu', parentCode: 'data-analysis', sort: 1 },
      { name: 'HIS对接分析', code: 'his-integration', path: '/integration/his-analysis', icon: 'GitMerge', type: 'menu', parentCode: 'data-analysis', sort: 2 },
      { name: 'HIS检验映射', code: 'his-test-mapping', path: '/integration/his-test-mapping', icon: 'ArrowLeftRight', type: 'menu', parentCode: 'data-analysis', sort: 3 },
      { name: '环境监测', code: 'env-monitor', icon: 'ShieldCheck', type: 'directory', sort: 4 },
      { name: '环境卫生', code: 'env-hygiene', path: '/env/hygiene', icon: 'Droplets', type: 'menu', parentCode: 'env-monitor', sort: 0 },
      { name: '消毒灭菌', code: 'env-sterilization', path: '/env/sterilization', icon: 'Flame', type: 'menu', parentCode: 'env-monitor', sort: 1 },
      { name: '职业安全', code: 'occupational-safety', icon: 'HardHat', type: 'directory', sort: 5 },
      { name: '职业暴露', code: 'occupational-exposure', path: '/occupational/exposure', icon: 'ShieldAlert', type: 'menu', parentCode: 'occupational-safety', sort: 0 },
      { name: '手卫生监测', code: 'hand-hygiene', path: '/occupational/hand-hygiene', icon: 'Hand', type: 'menu', parentCode: 'occupational-safety', sort: 1 },
      { name: '抗菌药物', code: 'antibiotic', path: '/antibiotic/usage', icon: 'Pill', type: 'menu', sort: 6 },
      { name: '系统管理', code: 'system', icon: 'Settings', type: 'directory', sort: 7 },
      { name: '用户管理', code: 'system-user', path: '/system/users', icon: 'Users', type: 'menu', parentCode: 'system', sort: 0 },
      { name: '角色管理', code: 'system-role', path: '/system/roles', icon: 'UserCog', type: 'menu', parentCode: 'system', sort: 1 },
      { name: '菜单管理', code: 'system-menu', path: '/system/menus', icon: 'Menu', type: 'menu', parentCode: 'system', sort: 2 },
      { name: '权限管理', code: 'system-permission', path: '/system/permissions', icon: 'KeyRound', type: 'menu', parentCode: 'system', sort: 3 },
    ];
    const menuMap = new Map<string, string>();
    for (const d of menuDefs.filter(d => !d.parentCode)) {
      const m = await db.menu.create({ data: { name: d.name, code: d.code, path: d.path ?? null, icon: d.icon ?? null, type: d.type, sort: d.sort, visible: 1, status: 1 } });
      menuMap.set(d.code, m.id);
    }
    for (const d of menuDefs.filter(d => d.parentCode)) {
      const m = await db.menu.create({ data: { parentId: menuMap.get(d.parentCode!) ?? null, name: d.name, code: d.code, path: d.path ?? null, icon: d.icon ?? null, type: d.type, sort: d.sort, visible: 1, status: 1 } });
      menuMap.set(d.code, m.id);
    }
    const allMenus = await db.menu.findMany();

    // Roles
    const superAdmin = await db.role.create({ data: { code: 'super_admin', name: '超级管理员', description: '拥有系统所有权限', sort: 0, status: 1 } });
    const infectionCtrl = await db.role.create({ data: { code: 'infection_control', name: '感控专员', description: '感染管理相关权限', sort: 1, status: 1 } });
    const clinicalDoc = await db.role.create({ data: { code: 'clinical_doctor', name: '临床医师', description: '基本查看和上报权限', sort: 2, status: 1 } });

    await db.rolePermission.createMany({ data: allPerms.map(p => ({ roleId: superAdmin.id, permissionId: p.id })) });
    await db.roleMenu.createMany({ data: allMenus.map(m => ({ roleId: superAdmin.id, menuId: m.id })) });

    const icPerms = allPerms.filter(p => /^(infection:|id:|warning:|micro:|system:role:|system:menu:|integration:|his:)/.test(p.code)).map(p => p.id);
    await db.rolePermission.createMany({ data: icPerms.map(pid => ({ roleId: infectionCtrl.id, permissionId: pid })) });
    const icMenuCodes = ['dashboard','infection-monitor','infection-case','infection-warning','infection-warning-rules','micro-lab-results','infection-target','infectious-disease','id-case-report','id-contact-tracing','id-symptom-surveillance','id-epidemic-dashboard','id-disease-alert','infectious-disease-test-items','data-analysis','data-statistics','data-report','his-integration','his-test-mapping','env-monitor','env-hygiene','env-sterilization','occupational-safety','occupational-exposure','hand-hygiene','antibiotic'];
    await db.roleMenu.createMany({ data: allMenus.filter(m => icMenuCodes.includes(m.code)).map(m => ({ roleId: infectionCtrl.id, menuId: m.id })) });

    const cdPerms = allPerms.filter(p => ['infection:case:list','infection:case:add','infection:warning:list','infection:exposure:list','infection:exposure:add','infection:handhygiene:list','id:case:list','id:case:add','id:symptom:list','id:symptom:add','id:dashboard:view'].includes(p.code)).map(p => p.id);
    await db.rolePermission.createMany({ data: cdPerms.map(pid => ({ roleId: clinicalDoc.id, permissionId: pid })) });
    const cdMenuCodes = ['dashboard','infection-monitor','infection-case','infection-warning','occupational-safety','occupational-exposure','hand-hygiene','infectious-disease','id-case-report','id-symptom-surveillance','id-epidemic-dashboard'];
    await db.roleMenu.createMany({ data: allMenus.filter(m => cdMenuCodes.includes(m.code)).map(m => ({ roleId: clinicalDoc.id, menuId: m.id })) });

    // Users
    const admin = await db.user.create({ data: { username: 'admin', password: 'admin123', name: '系统管理员', dept: '信息科', status: 1 } });
    const gk = await db.user.create({ data: { username: 'gkzj', password: '123456', name: '张感控', dept: '感控科', status: 1 } });
    const ls = await db.user.create({ data: { username: 'doctor', password: '123456', name: '李医生', dept: '内科', status: 1 } });
    const wm = await db.user.create({ data: { username: 'nurse', password: '123456', name: '王护士', dept: '外科', status: 1 } });
    const zl = await db.user.create({ data: { username: 'zljc', password: '123456', name: '赵检验', dept: '检验科', status: 1 } });
    await db.userRole.createMany({ data: [
      { userId: admin.id, roleId: superAdmin.id }, { userId: gk.id, roleId: infectionCtrl.id },
      { userId: ls.id, roleId: clinicalDoc.id }, { userId: wm.id, roleId: clinicalDoc.id },
      { userId: zl.id, roleId: infectionCtrl.id },
    ] });

    // === Business Data ===
    const depts = ['ICU','外科','内科','儿科','妇产科','急诊科','血液科','肿瘤科'];
    const sites = ['手术部位','呼吸道','泌尿道','血流','皮肤软组织','胃肠道'];
    const pathList = ['大肠埃希菌','金黄色葡萄球菌','MRSA','铜绿假单胞菌','肺炎克雷伯菌','CRKP','鲍曼不动杆菌','白色念珠菌'];

    await db.infectionCase.createMany({ data: Array.from({ length: 25 }, (_, i) => {
      const d = new Date(2024, i % 12, (i * 3 % 28) + 1);
      return { patientId: `P${String(20240001 + i).padStart(8,'0')}`, patientName: `患者${i+1}`, gender: i%3===0?'女':'男', age: 20+i%60, dept: depts[i%8], bedNo: `${Math.floor(i/5)+1}${String((i%8)+1).padStart(2,'0')}`, admissionDate: d, infectionDate: d, infectionSite: sites[i%6], infectionType: '院内感染', pathogen: pathList[i%8], outcome: i%5===0?null:['治愈','好转','未愈','死亡'][i%4], reporter: [gk.name,ls.name,wm.name][i%3], status: ['待审核','已确认','已排除'][i%3] };
    }) });

    await db.warningRecord.createMany({ data: Array.from({ length: 15 }, (_, i) => ({
      patientId: `P${String(20240030+i).padStart(8,'0')}`, patientName: `预警患者${i+1}`, dept: depts[i%8],
      warningType: ['病例预警','聚集预警','暴发预警'][i%3], warningLevel: ['高','中','低'][i%3],
      description: `${depts[i%8]}科室发现异常感染情况，需关注`, status: ['待处理','已确认','已排除','已处理'][i%4],
      handler: i%2===0?gk.name:null, handleResult: i%4===0?'已确认感染，启动防控措施':null,
      handleTime: i%2===0?new Date(2024,i%12,(i*2%28)+1):null,
    })) });

    await db.environmentalMonitor.createMany({ data: Array.from({ length: 20 }, (_, i) => {
      const q = Math.random()>0.2;
      return { dept: ['手术室','ICU','产房','新生儿室','供应室'][i%5], samplePoint: ['手术室','ICU','产房','新生儿室','供应室'][i%5], sampleType: ['空气','物体表面','医务人员手'][i%3], sampleDate: new Date(2024,i%12,(i*2%28)+1), sampler: [zl.name,wm.name][i%2], result: q?'合格':'不合格', colonyCount: q?Math.random()*3+0.5:Math.random()*10+5, standardLimit: [4,5,10][i%3], reviewer: i%3===0?gk.name:null, reviewStatus: i%5===0?'待审核':i%3===0?'退回':'已审核' };
    }) });

    await db.sterilizationMonitor.createMany({ data: Array.from({ length: 12 }, (_, i) => {
      const q = Math.random()>0.1; const m = ['高压蒸汽','环氧乙烷','等离子'][i%3];
      return { batchNo: `SM${String(2024001+i).padStart(7,'0')}`, sterilizer: `灭菌器${Math.floor(i/3)+1}号`, method: m, temperature: m==='高压蒸汽'?121+Math.random()*13:null, pressure: m==='高压蒸汽'?0.1+Math.random()*0.1:null, duration: m==='高压蒸汽'?25:m==='环氧乙烷'?150:40, operator: wm.name, sterilizeDate: new Date(2024,i%12,(i*3%28)+1), bioResult: q?'合格':'不合格', chemResult: q?'合格':'不合格', status: q?'合格':'不合格' };
    }) });

    await db.occupationalExposure.createMany({ data: Array.from({ length: 10 }, (_, i) => ({
      staffName: `员工${i+1}`, staffDept: depts[i%8], exposureType: ['针刺伤','血液体液暴露','其他'][i%3],
      exposureSource: `患者P${String(20240050+i).padStart(8,'0')}`, exposurePart: ['左手食指','右手前臂','左眼结膜','口腔黏膜'][i%4],
      exposureDate: new Date(2024,i%12,(i*2%28)+1), emergencyAction: '立即冲洗并报告',
      riskLevel: ['高','中','低'][i%3], followUpPlan: '随访3个月', status: ['已上报','评估中','随访中','已结案'][i%4],
    })) });

    const abDepts = ['ICU','外科','内科','儿科','妇产科'];
    const abData: any[] = [];
    for (let m = 7; m <= 12; m++) for (const d of abDepts) {
      const t = 80+Math.floor(Math.random()*120); const r = d==='ICU'?60+Math.random()*20:d==='外科'?40+Math.random()*15:25+Math.random()*15;
      abData.push({ dept: d, month: `2024-${String(m).padStart(2,'0')}`, totalPatients: t, antibioticPatients: Math.round(t*r/100), usageRate: Math.round(r*100)/100, ddd: d==='ICU'?90:35, pathogenSendRate: 35+Math.random()*25 });
    }
    await db.antibioticUsage.createMany({ data: abData });

    const hhData: any[] = [];
    for (let m = 7; m <= 12; m++) for (const d of abDepts) {
      const t = 200+Math.floor(Math.random()*300); const r = d==='ICU'?85:70;
      hhData.push({ dept: d, month: `2024-${String(m).padStart(2,'0')}`, totalOpportunities: t, compliantActions: Math.round(t*r/100), complianceRate: r, beforeContact: r-5, beforeAseptic: r+5, afterContact: r+3, afterFluid: r+8, afterSurrounding: r-8 });
    }
    await db.handHygiene.createMany({ data: hhData });

    await db.infectionReport.createMany({ data: [
      { title: '2024年7月感染监测月报', type: '月报', period: '2024-07', content: '## 感染监测月报\n\n本月感染监测数据汇总。', author: gk.name, status: '草稿' },
      { title: '2024年Q3感染监测季报', type: '季报', period: '2024-Q3', content: '## 季度感染监测报告', author: gk.name, status: '已提交' },
      { title: 'ICU多重耐药菌专项分析', type: '专项', period: '2024-ICU-MDRO', content: '## ICU MDRO专项分析', author: gk.name, status: '已审核' },
    ] });

    // InfectiousDiseaseCase - 5 generated records
    const diseases = [
      { name: '霍乱', code: 'A00.9', cat: '甲类', sev: '重症' },
      { name: '新型冠状病毒感染', code: 'U07.1', cat: '乙类', sev: '普通' },
      { name: '肺结核', code: 'A15.0', cat: '乙类', sev: '普通' },
      { name: '手足口病', code: 'B08.4', cat: '丙类', sev: '轻症' },
      { name: '流行性感冒', code: 'J11.1', cat: '丙类', sev: '轻症' },
    ];
    const idCases: any[] = [];
    for (let i = 0; i < 5; i++) {
      const ds = diseases[i]; const dd = new Date(2024, i*2, (i*5%28)+1);
      idCases.push({ patientId: `ID2024000${i+1}`, patientName: `患者${i+1}`, gender: i%2===0?'男':'女', age: 20+i*10, dept: i<2?'感染科':i<4?'儿科':'呼吸科', bedNo: `ID-0${i+1}`, diagnosisDate: dd, reportDate: dd, diseaseName: ds.name, diseaseCode: ds.code, diseaseCategory: ds.cat, reportType: '初次报告', severity: ds.sev, reporter: i%2===0?ls.name:wm.name, status: i<3?'已审核':'待审核', reportToCDC: i<2?1:0, reportToCDCTime: i<2?dd:null });
    }
    await db.infectiousDiseaseCase.createMany({ data: idCases });
    const allIdCases = await db.infectiousDiseaseCase.findMany();

    // ContactTracing - 5 generated records
    await db.contactTracing.createMany({ data: Array.from({ length: 5 }, (_, i) => ({
      caseId: allIdCases[i%allIdCases.length].id, casePatientName: allIdCases[i%allIdCases.length].patientName,
      contactName: `接触者${i+1}`, relationship: ['家属','同事','医护'][i%3], contactType: i%2===0?'密切接触':'一般接触',
      contactDate: new Date(2024,i*2%12,(i*3%28)+1), exposureLevel: ['高','中','低'][i%3],
      symptomStatus: i%4===0?'有症状':'无症状', quarantineType: i%2===0?'集中隔离':'自我健康监测',
      testResult: i%3===0?'阳性':'阴性', followUpStatus: i%2===0?'已解除':'随访中', followUpPerson: gk.name,
      status: '已确认',
    })) });

    // SymptomSurveillance - 5 generated records
    await db.symptomSurveillance.createMany({ data: Array.from({ length: 5 }, (_, i) => ({
      dept: depts[i%8], patientName: `症状患者${i+1}`, gender: i%2===0?'男':'女', age: 20+i*10,
      temperature: 37.5+i*0.5, symptomGroup: ['发热','腹泻','皮疹','呼吸道','出血热'][i%5],
      symptomDetail: `${['发热','腹泻','皮疹','咳嗽','出血'][i%5]}症状${i+1}天`,
      onsetDate: new Date(2024,i%12,(i*2%28)+1), reportDate: new Date(2024,i%12,(i*2%28)+2),
      reporter: [ls.name,wm.name][i%2], isClustered: i%3===0?1:0, alertTriggered: i%3===0?1:0,
      preliminaryJudge: ['上呼吸道感染','急性胃肠炎','水痘','肺炎','出血热疑似'][i%5],
      handlingMeasure: '对症治疗，注意隔离观察', status: ['已核实','已预警','排除'][i%3],
    })) });

    // DiseaseAlert - 5 generated records
    await db.diseaseAlert.createMany({ data: Array.from({ length: 5 }, (_, i) => ({
      alertType: ['法定传染病预警','聚集性疫情预警','症状监测预警','输入性传染病预警','聚集性疫情预警'][i],
      alertLevel: ['红色','橙色','黄色','黄色','橙色'][i], diseaseName: i<2?diseases[i].name:null,
      alertSource: ['病例上报','症状监测','系统自动','人工上报','系统自动'][i],
      triggerRule: `${diseases[i].cat}传染病预警规则`, relatedCaseIds: allIdCases[i%allIdCases.length]?.id??null,
      affectedDept: depts[i%8], affectedCount: i+1,
      description: `发现${diseases[i].name}病例，需关注防控措施`,
      suggestion: '1.隔离管理；2.追踪接触者；3.环境消毒',
      handler: i<3?gk.name:null, handleResult: i<3?'已启动防控措施':null, handleTime: i<3?new Date(2024,i%12,(i*3%28)+1):null,
      status: ['已处理','处理中','待处理','待处理','处理中'][i],
    })) });

    // WarningRules - compact
    await db.warningRule.createMany({ data: [
      { name: 'ICU感染发病率超标预警', code: 'WR_ICU_INF_RATE', category: '感染监测', ruleType: '阈值预警', description: 'ICU月度感染发病率>5%', conditionType: '大于', conditionField: 'infectionRate', conditionOperator: 'gt', conditionValue: '5', timeWindow: 720, warningLevel: '高', warningType: '暴发预警', targetDepts: 'ICU', actionType: 'escalate', cooldownMinutes: 1440, priority: 10, isSystem: 1, enabled: 1, triggerCount: 3, lastTriggeredAt: new Date(2024,11,5), createdBy: '系统' },
      { name: '科室感染发病率预警', code: 'WR_DEPT_INF_RATE', category: '感染监测', ruleType: '阈值预警', description: '科室月度感染发病率>3%', conditionType: '大于', conditionField: 'infectionRate', conditionOperator: 'gt', conditionValue: '3', timeWindow: 720, warningLevel: '中', warningType: '聚集预警', actionType: 'notify', cooldownMinutes: 1440, priority: 5, isSystem: 1, enabled: 1, triggerCount: 12, lastTriggeredAt: new Date(2024,10,20), createdBy: '系统' },
      { name: '甲类传染病即时预警', code: 'WR_CLASS_A_ID', category: '传染病管理', ruleType: '时效预警', description: '甲类传染病2小时内必须上报', conditionType: '等于', conditionField: 'notifiableDisease', conditionOperator: 'eq', conditionValue: '甲类', timeWindow: 2, warningLevel: '高', warningType: '暴发预警', targetDiseases: '霍乱,鼠疫', actionType: 'escalate', cooldownMinutes: 30, priority: 20, isSystem: 1, enabled: 1, triggerCount: 2, lastTriggeredAt: new Date(2024,1,4), createdBy: '系统' },
      { name: '乙类传染病上报预警', code: 'WR_CLASS_B_ID', category: '传染病管理', ruleType: '时效预警', description: '乙类传染病24小时未上报预警', conditionType: '时间超限', conditionField: 'notifiableDisease', conditionOperator: 'timeout', conditionValue: '乙类', timeWindow: 24, warningLevel: '中', warningType: '病例预警', actionType: 'notify', cooldownMinutes: 60, priority: 15, isSystem: 1, enabled: 1, triggerCount: 5, lastTriggeredAt: new Date(2024,10,14), createdBy: '系统' },
      { name: '同科室3例聚集感染预警', code: 'WR_CLUSTER_3', category: '感染监测', ruleType: '聚集预警', description: '同科室7天内3例同部位感染', conditionType: '大于等于', conditionField: 'caseCount', conditionOperator: 'gte', conditionValue: '3', timeWindow: 168, warningLevel: '高', warningType: '聚集预警', actionType: 'escalate', cooldownMinutes: 360, priority: 8, isSystem: 1, enabled: 1, triggerCount: 1, lastTriggeredAt: new Date(2024,8,15), createdBy: '系统' },
      { name: '多重耐药菌检出预警', code: 'WR_MDRO_DETECT', category: '感染监测', ruleType: '阈值预警', description: '检出MDRO时触发预警', conditionType: '大于', conditionField: 'mdroCount', conditionOperator: 'gt', conditionValue: '0', timeWindow: 24, warningLevel: '中', warningType: '病例预警', actionType: 'notify', cooldownMinutes: 120, priority: 6, isSystem: 1, enabled: 1, triggerCount: 8, lastTriggeredAt: new Date(2024,11,1), createdBy: '系统' },
      { name: '环境菌落超标预警', code: 'WR_ENV_COLONY', category: '环境监测', ruleType: '阈值预警', description: '菌落数超标预警', conditionType: '大于', conditionField: 'colonyCount', conditionOperator: 'gt', conditionValue: 'standardLimit', timeWindow: 24, warningLevel: '中', warningType: '环境预警', actionType: 'notify', cooldownMinutes: 120, priority: 4, isSystem: 1, enabled: 1, triggerCount: 4, lastTriggeredAt: new Date(2024,9,10), createdBy: '系统' },
      { name: '手卫生依从率偏低预警', code: 'WR_HAND_HYGIENE', category: '职业安全', ruleType: '阈值预警', description: '月度手卫生依从率<70%', conditionType: '小于', conditionField: 'handHygieneRate', conditionOperator: 'lt', conditionValue: '70', timeWindow: 720, warningLevel: '低', warningType: '职业暴露预警', actionType: 'notify', cooldownMinutes: 1440, priority: 2, isSystem: 1, enabled: 1, triggerCount: 6, lastTriggeredAt: new Date(2024,10,5), createdBy: '系统' },
      { name: '发热症状聚集预警', code: 'WR_FEVER_CLUSTER', category: '症状监测', ruleType: '聚集预警', description: '同科室3天内5例及以上发热', conditionType: '大于等于', conditionField: 'feverCount', conditionOperator: 'gte', conditionValue: '5', timeWindow: 72, warningLevel: '高', warningType: '聚集预警', actionType: 'escalate', cooldownMinutes: 240, priority: 9, isSystem: 1, enabled: 1, triggerCount: 2, lastTriggeredAt: new Date(2024,7,20), createdBy: '系统' },
      { name: 'CRAB检出预警', code: 'WR-MDRO-CRAB', category: '感染监测', ruleType: '阈值预警', description: '检出耐碳青霉烯类鲍曼不动杆菌', conditionType: '包含', conditionField: 'mdroDetection', conditionOperator: 'contains', conditionValue: '鲍曼不动杆菌', timeWindow: 24, warningLevel: '高', warningType: '病例预警', targetDepts: 'ICU,呼吸科', targetSites: '呼吸道,血流', actionType: 'notify', actionConfig: '{"notifyRoles":["infection_control"]}', cooldownMinutes: 60, priority: 10, isSystem: 1, enabled: 1, triggerCount: 3, lastTriggeredAt: new Date(2024,11,15), createdBy: 'system' },
      { name: 'CRKP检出预警', code: 'WR-MDRO-CRKP', category: '感染监测', ruleType: '阈值预警', description: '检出耐碳青霉烯类肺炎克雷伯菌', conditionType: '包含', conditionField: 'mdroDetection', conditionOperator: 'contains', conditionValue: '肺炎克雷伯菌', timeWindow: 24, warningLevel: '高', warningType: '病例预警', targetDepts: 'ICU,外科,内科', targetSites: '血流,泌尿道,呼吸道', actionType: 'notify', actionConfig: '{"notifyRoles":["infection_control"]}', cooldownMinutes: 60, priority: 10, isSystem: 1, enabled: 1, triggerCount: 2, lastTriggeredAt: new Date(2024,11,10), createdBy: 'system' },
      { name: 'MRSA检出预警', code: 'WR-MDRO-MRSA', category: '感染监测', ruleType: '阈值预警', description: '检出耐甲氧西林金黄色葡萄球菌', conditionType: '包含', conditionField: 'mdroDetection', conditionOperator: 'contains', conditionValue: '金黄色葡萄球菌', timeWindow: 24, warningLevel: '中', warningType: '病例预警', targetDepts: 'ICU,外科,骨科', targetSites: '手术部位,呼吸道,血流', actionType: 'notify', actionConfig: '{"notifyRoles":["infection_control"]}', cooldownMinutes: 60, priority: 8, isSystem: 1, enabled: 1, triggerCount: 5, lastTriggeredAt: new Date(2024,11,12), createdBy: 'system' },
    ] });

    // MicroLabResult - 5 generated records
    await db.microLabResult.createMany({ data: [
      { patientId: 'ML001', patientName: '患者1', dept: 'ICU', bedNo: 'ICU-01', specimenType: '痰液', specimenNo: 'SP001', reportItemName: '鲍曼不动杆菌[CRAB]', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 1, mdroType: 'CRAB', organismName: '耐碳青霉烯类鲍曼不动杆菌', reportTime: new Date(2024,6,15,10,30), operator: zl.name, reviewer: gk.name, warningTriggered: 1, status: '已审核' },
      { patientId: 'ML002', patientName: '患者2', dept: 'ICU', bedNo: 'ICU-03', specimenType: '血液', specimenNo: 'SP002', reportItemName: '肺炎克雷伯菌[CRKP]', resultValue: '阳性', referenceRange: '阴性', isAbnormal: 1, isMDRO: 1, mdroType: 'CRKP', organismName: '耐碳青霉烯类肺炎克雷伯菌', reportTime: new Date(2024,6,16,14,20), operator: zl.name, reviewer: gk.name, warningTriggered: 1, status: '已审核' },
      { patientId: 'ML003', patientName: '患者3', dept: '外科', bedNo: 'WK-05', specimenType: '分泌物', specimenNo: 'SP003', reportItemName: '金黄色葡萄球菌[MRSA]', resultValue: '阳性', referenceRange: '阴性', isAbnormal: 1, isMDRO: 1, mdroType: 'MRSA', organismName: '耐甲氧西林金黄色葡萄球菌', reportTime: new Date(2024,6,17,9,15), operator: zl.name, reviewer: gk.name, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML004', patientName: '患者4', dept: '内科', bedNo: 'NK-12', specimenType: '尿液', specimenNo: 'SP004', reportItemName: '屎肠球菌[VRE]', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 1, mdroType: 'VRE', organismName: '耐万古霉素屎肠球菌', reportTime: new Date(2024,6,18,11,45), operator: zl.name, reviewer: gk.name, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML005', patientName: '患者5', dept: 'ICU', bedNo: 'ICU-07', specimenType: '痰液', specimenNo: 'SP005', reportItemName: '铜绿假单胞菌[CRPA]', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 1, mdroType: 'CRPA', organismName: '耐碳青霉烯类铜绿假单胞菌', reportTime: new Date(2024,6,19,16,0), operator: zl.name, reviewer: gk.name, warningTriggered: 0, status: '已审核' },
    ] });

    // === HIS Mapping Seed Data ===

    // HisBusinessScenario
    await db.hisBusinessScenario.createMany({ data: [
      { scenarioId: 'infection-case', name: '医院感染病例', module: '感染监测', hisSystem: 'HIS住院系统', priority: '高', description: '从HIS获取患者住院信息，自动填充感染病例报告表单', sort: 0, status: 1 },
      { scenarioId: 'infectious-disease', name: '法定传染病报告', module: '传染病管理', hisSystem: 'HIS门诊/住院系统', priority: '高', description: '从HIS获取患者就诊信息，支持传染病法定报告', sort: 1, status: 1 },
      { scenarioId: 'micro-lab', name: '微生物检验结果', module: '微生物检验', hisSystem: 'LIS检验系统', priority: '高', description: '从LIS获取微生物培养和药敏结果', sort: 2, status: 1 },
      { scenarioId: 'environmental', name: '环境卫生监测', module: '环境监测', hisSystem: 'HIS院感系统', priority: '中', description: '环境采样检测数据的采集和管理', sort: 3, status: 1 },
      { scenarioId: 'sterilization', name: '消毒灭菌监测', module: '消毒灭菌', hisSystem: 'HIS院感系统', priority: '中', description: '消毒灭菌过程监测数据', sort: 4, status: 1 },
      { scenarioId: 'occupational', name: '职业暴露管理', module: '职业安全', hisSystem: 'HIS人事系统', priority: '中', description: '医护人员职业暴露事件管理', sort: 5, status: 1 },
      { scenarioId: 'antibiotic', name: '抗菌药物使用', module: '抗菌药物', hisSystem: 'HIS医嘱系统', priority: '高', description: '抗菌药物使用数据统计和监测', sort: 6, status: 1 },
      { scenarioId: 'hand-hygiene', name: '手卫生监测', module: '手卫生', hisSystem: 'HIS院感系统', priority: '中', description: '手卫生依从性监测数据', sort: 7, status: 1 },
      { scenarioId: 'warning-rule', name: '预警规则配置', module: '智能预警', hisSystem: 'HIS院感系统', priority: '高', description: '基于规则引擎的智能预警系统', sort: 8, status: 1 },
      { scenarioId: 'temperature', name: '体温监测对接', module: '症状监测', hisSystem: 'HIS护理系统', priority: '高', description: '从HIS护理系统实时获取患者体温数据，自动判定发热并上报症状监测', sort: 9, status: 1 },
    ] });

    // HisFieldMapping - infection-case
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'infection-case', systemField: 'patientId', systemLabel: '患者编号', dataType: 'String', length: 20, required: 1, hisField: 'PATIENT_ID', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '住院号，非身份证号', validationRule: '非空，格式P+8位数字', consistencyRisk: 'HIS住院号与院感系统患者ID编码规则不一致', sort: 0, status: 1 },
      { scenarioId: 'infection-case', systemField: 'patientName', systemLabel: '患者姓名', dataType: 'String', length: 50, required: 1, hisField: 'PATIENT_NAME', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '脱敏显示时仅显示姓+**', validationRule: '非空，2-50个字符', consistencyRisk: '姓名中可能含特殊字符，HIS与院感编码不同', sort: 1, status: 1 },
      { scenarioId: 'infection-case', systemField: 'gender', systemLabel: '性别', dataType: 'Enum', length: 4, required: 1, hisField: 'SEX_CODE', hisTable: 'PAT_VISIT', transformRule: '代码转换：1→男，2→女，0→未知', specialLogic: 'HIS使用国标性别代码', validationRule: '枚举值：男/女/未知', consistencyRisk: 'HIS性别代码与院感系统枚举值映射可能不完整', sort: 2, status: 1 },
      { scenarioId: 'infection-case', systemField: 'age', systemLabel: '年龄', dataType: 'Int', length: 3, required: 1, hisField: 'AGE', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '需根据入院日期动态计算，不直接取HIS存储的年龄', validationRule: '0-150之间的整数', consistencyRisk: 'HIS年龄为入院时静态值，院感需实时计算', sort: 3, status: 1 },
      { scenarioId: 'infection-case', systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: 1, hisField: 'DEPT_CODE', hisTable: 'PAT_VISIT', transformRule: '代码映射：HIS科室编码→院感科室名称', specialLogic: '需要科室字典映射表，支持科室合并/拆分', validationRule: '非空，必须在科室字典中', consistencyRisk: 'HIS科室编码变更后映射表需同步更新', sort: 4, status: 1 },
      { scenarioId: 'infection-case', systemField: 'bedNo', systemLabel: '床号', dataType: 'String', length: 20, required: 0, hisField: 'BED_NO', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '转科时需记录原床号', validationRule: '字母+数字格式', consistencyRisk: '转科后HIS更新床号，院感需保留感染时床号', sort: 5, status: 1 },
      { scenarioId: 'infection-case', systemField: 'admissionDate', systemLabel: '入院日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'ADMISSION_DATE', hisTable: 'PAT_VISIT', transformRule: '日期格式转换：YYYYMMDD→YYYY-MM-DD', specialLogic: 'HIS存储格式为YYYYMMDDHHmmss', validationRule: '有效日期，不晚于当前日期', consistencyRisk: 'HIS时区与院感系统时区不一致可能导致日期偏移', sort: 6, status: 1 },
      { scenarioId: 'infection-case', systemField: 'infectionDate', systemLabel: '感染日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'DIAG_DATE', hisTable: 'PAT_DIAG', transformRule: '取首次诊断日期', specialLogic: '需根据感染诊断判定，非直接取诊断日期', validationRule: '有效日期，晚于入院日期48h', consistencyRisk: 'HIS诊断日期≠感染日期，需临床判定', sort: 7, status: 1 },
      { scenarioId: 'infection-case', systemField: 'infectionSite', systemLabel: '感染部位', dataType: 'Enum', length: 30, required: 1, hisField: 'DIAG_CODE', hisTable: 'PAT_DIAG', transformRule: 'ICD-10编码→感染部位映射', specialLogic: '需根据ICD编码关联感染部位字典', validationRule: '枚举值，必须为预定义部位', consistencyRisk: 'ICD编码与感染部位非一对一映射，需人工审核', sort: 8, status: 1 },
      { scenarioId: 'infection-case', systemField: 'infectionType', systemLabel: '感染类型', dataType: 'Enum', length: 20, required: 1, hisField: 'DIAG_TYPE', hisTable: 'PAT_DIAG', transformRule: '代码映射：1→院内感染，2→社区感染', specialLogic: '需根据入院48h规则判定', validationRule: '枚举值：院内感染/社区感染', consistencyRisk: '48h规则判定逻辑HIS中未实现，需院感系统补充', sort: 9, status: 1 },
      { scenarioId: 'infection-case', systemField: 'pathogen', systemLabel: '病原体', dataType: 'String', length: 100, required: 0, hisField: 'ORGANISM_NAME', hisTable: 'LAB_RESULT', transformRule: '微生物名称标准化映射', specialLogic: '需与LIS系统对接获取微生物培养结果', validationRule: '符合微生物命名规范', consistencyRisk: 'LIS菌名与院感菌名标准不一致（如缩写差异）', sort: 10, status: 1 },
      { scenarioId: 'infection-case', systemField: 'outcome', systemLabel: '转归', dataType: 'Enum', length: 10, required: 0, hisField: 'OUTCOME_CODE', hisTable: 'PAT_VISIT', transformRule: '代码映射：1→治愈，2→好转，3→未愈，4→死亡', specialLogic: 'HIS出院转归代码映射', validationRule: '枚举值：治愈/好转/未愈/死亡', consistencyRisk: 'HIS转归与院感转归分类口径不完全一致', sort: 11, status: 1 },
      { scenarioId: 'infection-case', systemField: 'reporter', systemLabel: '报告人', dataType: 'String', length: 30, required: 1, hisField: 'DOCTOR_NAME', hisTable: 'PAT_DIAG', transformRule: '取首诊医生姓名', specialLogic: '非首诊医生报告时需手动修改', validationRule: '非空', consistencyRisk: '报告人可能非首诊医生，HIS无此字段', sort: 12, status: 1 },
      { scenarioId: 'infection-case', systemField: 'status', systemLabel: '状态', dataType: 'Enum', length: 10, required: 1, hisField: 'REVIEW_STATUS', hisTable: 'PAT_DIAG', transformRule: '代码映射：0→待审核，1→已确认，2→已排除', specialLogic: '院感审核状态与HIS审核流程独立', validationRule: '枚举值：待审核/已确认/已排除', consistencyRisk: '院感审核与HIS审核为不同流程，状态可能冲突', sort: 13, status: 1 },
    ] });

    // HisFieldMapping - infectious-disease
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'infectious-disease', systemField: 'patientId', systemLabel: '患者编号', dataType: 'String', length: 20, required: 1, hisField: 'PATIENT_ID', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '门诊用门诊号，住院用住院号', validationRule: '非空', consistencyRisk: '门诊与住院编号规则不同，需统一处理', sort: 0, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'patientName', systemLabel: '患者姓名', dataType: 'String', length: 50, required: 1, hisField: 'PATIENT_NAME', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '传染病报告需全名，不脱敏', validationRule: '非空，2-50个字符', consistencyRisk: '传染病报告需实名，与其他模块脱敏规则冲突', sort: 1, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'idCard', systemLabel: '身份证号', dataType: 'String', length: 18, required: 1, hisField: 'ID_CARD_NO', hisTable: 'PAT_INFO', transformRule: '直接映射', specialLogic: '法定传染病报告必须项', validationRule: '18位身份证号格式校验', consistencyRisk: 'HIS中身份证号可能缺失或格式不规范', sort: 2, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'phone', systemLabel: '联系电话', dataType: 'String', length: 20, required: 1, hisField: 'PHONE_NO', hisTable: 'PAT_INFO', transformRule: '直接映射', specialLogic: '需确保可联系到患者', validationRule: '11位手机号或区号+座机号', consistencyRisk: 'HIS电话可能为旧号或无效号码', sort: 3, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'address', systemLabel: '现住址', dataType: 'String', length: 200, required: 1, hisField: 'ADDRESS', hisTable: 'PAT_INFO', transformRule: '地址标准化处理', specialLogic: '需精确到门牌号，与户籍地址可能不同', validationRule: '非空，详细地址', consistencyRisk: 'HIS地址数据可能不完整或不规范', sort: 4, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'diseaseName', systemLabel: '病种名称', dataType: 'String', length: 50, required: 1, hisField: 'DIAG_NAME', hisTable: 'PAT_DIAG', transformRule: 'HIS诊断名称→法定传染病标准名称', specialLogic: '需匹配传染病目录，支持ICD-10编码', validationRule: '必须在法定传染病目录中', consistencyRisk: 'HIS诊断名称与法定传染病名称表述差异', sort: 5, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'diseaseCode', systemLabel: '病种编码', dataType: 'String', length: 20, required: 1, hisField: 'DIAG_CODE', hisTable: 'PAT_DIAG', transformRule: 'ICD-10编码映射', specialLogic: '需对应传染病分类（甲/乙/丙类）', validationRule: '有效ICD-10编码', consistencyRisk: 'ICD编码版本差异（ICD-10 vs ICD-11）', sort: 6, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'diseaseCategory', systemLabel: '传染病分类', dataType: 'Enum', length: 10, required: 1, hisField: 'DIAG_CODE', hisTable: 'PAT_DIAG', transformRule: 'ICD编码→甲/乙/丙类映射', specialLogic: '根据病种编码自动判定分类', validationRule: '枚举值：甲类/乙类/丙类', consistencyRisk: '同一病种可能跨分类（如新冠乙类甲管）', sort: 7, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'onsetDate', systemLabel: '发病日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'SYMPTOM_ONSET', hisTable: 'PAT_VISIT', transformRule: '日期格式转换', specialLogic: 'HIS可能无此字段，需门诊病历提取', validationRule: '有效日期，不晚于诊断日期', consistencyRisk: 'HIS中发病日期字段经常为空', sort: 8, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'diagnosisDate', systemLabel: '诊断日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'DIAG_DATE', hisTable: 'PAT_DIAG', transformRule: '日期格式转换', specialLogic: '取首次诊断日期', validationRule: '有效日期', consistencyRisk: '首次诊断日期可能非传染病确诊日期', sort: 9, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'reportDate', systemLabel: '报告日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'REPORT_DATE', hisTable: 'NOTIFI_DISEASE', transformRule: '直接映射', specialLogic: '甲类2小时内、乙类24小时内上报', validationRule: '不超过法定时限', consistencyRisk: 'HIS报告时间≠实际上报CDC时间', sort: 10, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'reportType', systemLabel: '报告类型', dataType: 'Enum', length: 10, required: 1, hisField: 'REPORT_TYPE', hisTable: 'NOTIFI_DISEASE', transformRule: '代码映射：1→初次，2→订正，3→删除', specialLogic: '订正报告需关联原报告', validationRule: '枚举值', consistencyRisk: '订正报告关联逻辑HIS中实现不完善', sort: 11, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'infectionSource', systemLabel: '感染来源', dataType: 'String', length: 100, required: 0, hisField: 'INFECT_SOURCE', hisTable: 'NOTIFI_DISEASE', transformRule: '直接映射', specialLogic: 'HIS中该字段通常需手动填写', validationRule: '可选', consistencyRisk: 'HIS感染来源字段经常缺失', sort: 12, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'clinicalDiagnosis', systemLabel: '临床诊断', dataType: 'String', length: 200, required: 1, hisField: 'CLINICAL_DIAG', hisTable: 'PAT_DIAG', transformRule: '直接映射', specialLogic: '需包含分型信息', validationRule: '非空', consistencyRisk: 'HIS诊断可能不完整，缺少分型', sort: 13, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'labResult', systemLabel: '实验室结果', dataType: 'String', length: 500, required: 0, hisField: 'LAB_RESULT_TEXT', hisTable: 'LAB_RESULT', transformRule: 'LIS文本结果提取', specialLogic: '需从LIS系统获取', validationRule: '可选', consistencyRisk: 'LIS结果为结构化+文本混合，解析困难', sort: 14, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'severity', systemLabel: '严重程度', dataType: 'Enum', length: 10, required: 1, hisField: 'SEVERITY_CODE', hisTable: 'PAT_DIAG', transformRule: '代码映射：1→轻症，2→普通，3→重症，4→危重症', specialLogic: '需根据临床指标判定', validationRule: '枚举值', consistencyRisk: 'HIS中严重程度判定标准与传染病分类标准不同', sort: 15, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'isolationType', systemLabel: '隔离类型', dataType: 'Enum', length: 20, required: 0, hisField: 'ISOLATION_TYPE', hisTable: 'PAT_VISIT', transformRule: '代码映射', specialLogic: '根据病种自动推荐隔离类型', validationRule: '枚举值', consistencyRisk: 'HIS隔离类型与传染病防治法要求可能不完全对应', sort: 16, status: 1 },
      { scenarioId: 'infectious-disease', systemField: 'reportToCDC', systemLabel: '是否上报CDC', dataType: 'Enum', length: 4, required: 1, hisField: 'CDC_REPORT_FLAG', hisTable: 'NOTIFI_DISEASE', transformRule: '0→否，1→是', specialLogic: '甲类必须上报，乙类按需上报', validationRule: '布尔值', consistencyRisk: 'HIS上报标志与实际上报状态可能不同步', sort: 17, status: 1 },
    ] });

    // HisFieldMapping - micro-lab
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'micro-lab', systemField: 'testId', systemLabel: '检验编号', dataType: 'String', length: 30, required: 1, hisField: 'TEST_ID', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: 'LIS唯一标识', validationRule: '非空，唯一', consistencyRisk: 'LIS检验编号与院感编号编码规则不同', sort: 0, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'patientId', systemLabel: '患者编号', dataType: 'String', length: 20, required: 1, hisField: 'PATIENT_ID', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: '通过检验申请单关联患者', validationRule: '非空', consistencyRisk: 'LIS患者ID与HIS患者ID需通过就诊号关联', sort: 1, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'patientName', systemLabel: '患者姓名', dataType: 'String', length: 50, required: 1, hisField: 'PATIENT_NAME', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: 'LIS中姓名可能为入院时旧名', sort: 2, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'visitId', systemLabel: '就诊号', dataType: 'String', length: 30, required: 1, hisField: 'VISIT_ID', hisTable: 'LAB_ORDER', transformRule: '直接映射', specialLogic: '门诊/住院就诊号', validationRule: '非空', consistencyRisk: '门诊与住院就诊号格式不同', sort: 3, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: 1, hisField: 'ORDER_DEPT', hisTable: 'LAB_ORDER', transformRule: '代码映射', specialLogic: '取开单科室，非采样科室', validationRule: '非空', consistencyRisk: '开单科室≠患者所在科室，需关联住院信息', sort: 4, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'specimenType', systemLabel: '标本类型', dataType: 'Enum', length: 20, required: 1, hisField: 'SPECIMEN_TYPE', hisTable: 'LAB_SPECIMEN', transformRule: 'LIS标本代码→标准标本类型', specialLogic: '需标本类型字典映射', validationRule: '枚举值', consistencyRisk: 'LIS标本类型编码与院感标准不一致', sort: 5, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'specimenNo', systemLabel: '标本编号', dataType: 'String', length: 30, required: 1, hisField: 'SPECIMEN_ID', hisTable: 'LAB_SPECIMEN', transformRule: '直接映射', specialLogic: '', validationRule: '非空，唯一', consistencyRisk: '标本编号在LIS中的唯一性需确认', sort: 6, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'collectTime', systemLabel: '采集时间', dataType: 'DateTime', length: 20, required: 1, hisField: 'COLLECT_TIME', hisTable: 'LAB_SPECIMEN', transformRule: '时间格式转换', specialLogic: '精确到分钟', validationRule: '有效日期时间', consistencyRisk: 'LIS采集时间可能缺失，用送检时间代替', sort: 7, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'reportTime', systemLabel: '报告时间', dataType: 'DateTime', length: 20, required: 1, hisField: 'REPORT_TIME', hisTable: 'LAB_RESULT', transformRule: '时间格式转换', specialLogic: '取审核报告时间', validationRule: '有效日期时间，晚于采集时间', consistencyRisk: '初步报告与最终报告时间需区分', sort: 8, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'reportItemName', systemLabel: '检验项目', dataType: 'String', length: 100, required: 1, hisField: 'ITEM_NAME', hisTable: 'LAB_RESULT', transformRule: '直接映射', specialLogic: '需匹配微生物培养项目', validationRule: '非空', consistencyRisk: 'LIS项目名称可能有别名', sort: 9, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'resultValue', systemLabel: '结果值', dataType: 'String', length: 100, required: 1, hisField: 'RESULT_VALUE', hisTable: 'LAB_RESULT', transformRule: '直接映射', specialLogic: '数值型结果需转数值，文本型原样保留', validationRule: '非空', consistencyRisk: 'LIS结果值格式不统一（含单位、参考值等）', sort: 10, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'isAbnormal', systemLabel: '是否异常', dataType: 'Enum', length: 4, required: 1, hisField: 'ABNORMAL_FLAG', hisTable: 'LAB_RESULT', transformRule: '代码转换：H→异常，N→正常', specialLogic: '需根据参考范围二次判定', validationRule: '布尔值', consistencyRisk: 'LIS异常标志与院感判定标准可能不同', sort: 11, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'isMDRO', systemLabel: '是否多重耐药', dataType: 'Enum', length: 4, required: 0, hisField: 'MDRO_FLAG', hisTable: 'LAB_RESULT', transformRule: 'LIS标记→院感MDRO判定', specialLogic: '需根据药敏结果综合判定', validationRule: '布尔值', consistencyRisk: 'LIS MDRO标记可能不准确，需院感二次确认', sort: 12, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'mdroType', systemLabel: '耐药菌类型', dataType: 'Enum', length: 20, required: 0, hisField: 'MDRO_TYPE', hisTable: 'LAB_RESULT', transformRule: '代码映射：CRAB/MRSA/CRKP/VRE/CRPA', specialLogic: '根据菌名+药敏结果自动判定', validationRule: '枚举值', consistencyRisk: '耐药菌分类标准更新后映射需同步', sort: 13, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'organismName', systemLabel: '菌名', dataType: 'String', length: 100, required: 0, hisField: 'ORGANISM_NAME', hisTable: 'LAB_CULTURE', transformRule: '菌名标准化', specialLogic: '需匹配院感菌名字典', validationRule: '符合微生物命名规范', consistencyRisk: 'LIS菌名含亚型信息，院感可能仅需到种水平', sort: 14, status: 1 },
      { scenarioId: 'micro-lab', systemField: 'antibioticResult', systemLabel: '药敏结果', dataType: 'String', length: 2000, required: 0, hisField: 'AST_RESULT', hisTable: 'LAB_AST', transformRule: '结构化解析：抗生素+MIC/R+S/I', specialLogic: 'JSON格式存储，含多种抗生素结果', validationRule: 'JSON格式校验', consistencyRisk: 'LIS药敏结果格式复杂，解析逻辑需持续维护', sort: 15, status: 1 },
    ] });

    // HisFieldMapping - environmental
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'environmental', systemField: 'dept', systemLabel: '监测科室', dataType: 'String', length: 50, required: 1, hisField: 'DEPT_CODE', hisTable: 'DEPT_DICT', transformRule: '代码映射', specialLogic: '科室字典映射', validationRule: '非空，在科室字典中', consistencyRisk: 'HIS科室编码与院感科室对应关系', sort: 0, status: 1 },
      { scenarioId: 'environmental', systemField: 'samplePoint', systemLabel: '采样点', dataType: 'String', length: 50, required: 1, hisField: 'SAMPLE_LOCATION', hisTable: 'ENV_SAMPLE', transformRule: '直接映射', specialLogic: '需关联科室-采样点字典', validationRule: '非空', consistencyRisk: '采样点命名规范HIS与院感可能不同', sort: 1, status: 1 },
      { scenarioId: 'environmental', systemField: 'sampleType', systemLabel: '标本类型', dataType: 'Enum', length: 20, required: 1, hisField: 'SAMPLE_TYPE', hisTable: 'ENV_SAMPLE', transformRule: '代码映射：1→空气，2→物体表面，3→医务人员手', specialLogic: '不同类型合格标准不同', validationRule: '枚举值', consistencyRisk: '标本类型分类口径可能不完全对应', sort: 2, status: 1 },
      { scenarioId: 'environmental', systemField: 'sampleDate', systemLabel: '采样日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'SAMPLE_DATE', hisTable: 'ENV_SAMPLE', transformRule: '日期格式转换', specialLogic: '', validationRule: '有效日期', consistencyRisk: 'HIS采样日期格式可能不一致', sort: 3, status: 1 },
      { scenarioId: 'environmental', systemField: 'sampler', systemLabel: '采样人', dataType: 'String', length: 30, required: 1, hisField: 'SAMPLER_NAME', hisTable: 'ENV_SAMPLE', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: 'HIS可能无采样人字段', sort: 4, status: 1 },
      { scenarioId: 'environmental', systemField: 'result', systemLabel: '检测结果', dataType: 'Enum', length: 10, required: 1, hisField: 'RESULT_CODE', hisTable: 'ENV_RESULT', transformRule: '代码映射：0→合格，1→不合格', specialLogic: '根据菌落数与标准限值比较', validationRule: '枚举值', consistencyRisk: 'HIS结果代码与院感判定标准需对齐', sort: 5, status: 1 },
      { scenarioId: 'environmental', systemField: 'colonyCount', systemLabel: '菌落数(CFU)', dataType: 'Float', length: 10, required: 1, hisField: 'COLONY_COUNT', hisTable: 'ENV_RESULT', transformRule: '直接映射', specialLogic: '需统一单位为CFU/cm²或CFU/皿', validationRule: '非负数值', consistencyRisk: 'HIS中菌落数单位可能不统一', sort: 6, status: 1 },
      { scenarioId: 'environmental', systemField: 'standardLimit', systemLabel: '标准限值', dataType: 'Float', length: 10, required: 1, hisField: 'STANDARD_VALUE', hisTable: 'ENV_STANDARD', transformRule: '根据标本类型关联标准', specialLogic: '不同类型不同限值', validationRule: '非负数值', consistencyRisk: '标准限值可能随法规更新变化', sort: 7, status: 1 },
      { scenarioId: 'environmental', systemField: 'reviewer', systemLabel: '审核人', dataType: 'String', length: 30, required: 0, hisField: 'REVIEWER_NAME', hisTable: 'ENV_RESULT', transformRule: '直接映射', specialLogic: '', validationRule: '可选', consistencyRisk: 'HIS中审核人与院感审核流程可能独立', sort: 8, status: 1 },
      { scenarioId: 'environmental', systemField: 'reviewStatus', systemLabel: '审核状态', dataType: 'Enum', length: 10, required: 1, hisField: 'REVIEW_STATUS', hisTable: 'ENV_RESULT', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: '审核流程HIS与院感独立运行', sort: 9, status: 1 },
    ] });

    // HisFieldMapping - sterilization
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'sterilization', systemField: 'batchNo', systemLabel: '灭菌批次号', dataType: 'String', length: 30, required: 1, hisField: 'BATCH_NO', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '', validationRule: '非空，唯一', consistencyRisk: 'HIS批次号编码规则需确认唯一性', sort: 0, status: 1 },
      { scenarioId: 'sterilization', systemField: 'sterilizer', systemLabel: '灭菌设备', dataType: 'String', length: 50, required: 1, hisField: 'DEVICE_NAME', hisTable: 'STER_DEVICE', transformRule: '设备编码→名称映射', specialLogic: '', validationRule: '非空', consistencyRisk: '设备编码与名称映射需维护', sort: 1, status: 1 },
      { scenarioId: 'sterilization', systemField: 'method', systemLabel: '灭菌方法', dataType: 'Enum', length: 20, required: 1, hisField: 'METHOD_CODE', hisTable: 'STER_RECORD', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: 'HIS灭菌方法分类可能不完全覆盖', sort: 2, status: 1 },
      { scenarioId: 'sterilization', systemField: 'temperature', systemLabel: '灭菌温度(℃)', dataType: 'Float', length: 6, required: 0, hisField: 'TEMPERATURE', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '高压蒸汽灭菌时必填', validationRule: '≥100℃（高压蒸汽）', consistencyRisk: 'HIS温度单位可能不一致（℃/℉）', sort: 3, status: 1 },
      { scenarioId: 'sterilization', systemField: 'pressure', systemLabel: '灭菌压力(MPa)', dataType: 'Float', length: 6, required: 0, hisField: 'PRESSURE', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '高压蒸汽灭菌时必填', validationRule: '0.1-0.3 MPa', consistencyRisk: '压力单位可能不一致（MPa/kPa）', sort: 4, status: 1 },
      { scenarioId: 'sterilization', systemField: 'duration', systemLabel: '灭菌时长(min)', dataType: 'Float', length: 6, required: 1, hisField: 'DURATION', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '', validationRule: '正数', consistencyRisk: 'HIS时长单位可能为秒需转换', sort: 5, status: 1 },
      { scenarioId: 'sterilization', systemField: 'operator', systemLabel: '操作人', dataType: 'String', length: 30, required: 1, hisField: 'OPERATOR_NAME', hisTable: 'STER_RECORD', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: '', sort: 6, status: 1 },
      { scenarioId: 'sterilization', systemField: 'sterilizeDate', systemLabel: '灭菌日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'STER_DATE', hisTable: 'STER_RECORD', transformRule: '日期格式转换', specialLogic: '', validationRule: '有效日期', consistencyRisk: '', sort: 7, status: 1 },
      { scenarioId: 'sterilization', systemField: 'bioResult', systemLabel: '生物监测结果', dataType: 'Enum', length: 10, required: 1, hisField: 'BIO_RESULT', hisTable: 'STER_RESULT', transformRule: '代码映射：P→合格，N→不合格', specialLogic: '', validationRule: '枚举值', consistencyRisk: 'HIS生物监测代码与院感系统不一致', sort: 8, status: 1 },
      { scenarioId: 'sterilization', systemField: 'chemResult', systemLabel: '化学监测结果', dataType: 'Enum', length: 10, required: 1, hisField: 'CHEM_RESULT', hisTable: 'STER_RESULT', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: '', sort: 9, status: 1 },
      { scenarioId: 'sterilization', systemField: 'status', systemLabel: '综合结果', dataType: 'Enum', length: 10, required: 1, hisField: 'OVERALL_RESULT', hisTable: 'STER_RESULT', transformRule: '综合判定：生物+化学均合格→合格', specialLogic: '', validationRule: '枚举值', consistencyRisk: '综合判定逻辑需与HIS对齐', sort: 10, status: 1 },
    ] });

    // HisFieldMapping - occupational
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'occupational', systemField: 'staffName', systemLabel: '暴露人员姓名', dataType: 'String', length: 30, required: 1, hisField: 'STAFF_NAME', hisTable: 'STAFF_INFO', transformRule: '直接映射', specialLogic: '从HIS人事系统获取', validationRule: '非空', consistencyRisk: 'HIS人事系统与院感系统人员编码不同', sort: 0, status: 1 },
      { scenarioId: 'occupational', systemField: 'staffDept', systemLabel: '所在科室', dataType: 'String', length: 50, required: 1, hisField: 'DEPT_CODE', hisTable: 'STAFF_INFO', transformRule: '代码映射', specialLogic: '', validationRule: '非空，在科室字典中', consistencyRisk: '人员科室变更后HIS更新，院感需保留暴露时科室', sort: 1, status: 1 },
      { scenarioId: 'occupational', systemField: 'exposureType', systemLabel: '暴露类型', dataType: 'Enum', length: 20, required: 1, hisField: 'EXPOSURE_TYPE', hisTable: 'OCC_EXPOSURE', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: 'HIS暴露类型分类可能不够细', sort: 2, status: 1 },
      { scenarioId: 'occupational', systemField: 'exposureSource', systemLabel: '暴露源', dataType: 'String', length: 50, required: 1, hisField: 'SOURCE_PATIENT_ID', hisTable: 'OCC_EXPOSURE', transformRule: '患者ID→患者姓名映射', specialLogic: '需关联患者信息', validationRule: '非空', consistencyRisk: '暴露源患者信息需从HIS住院系统关联', sort: 3, status: 1 },
      { scenarioId: 'occupational', systemField: 'exposurePart', systemLabel: '暴露部位', dataType: 'String', length: 50, required: 1, hisField: 'EXPOSURE_PART', hisTable: 'OCC_EXPOSURE', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: '', sort: 4, status: 1 },
      { scenarioId: 'occupational', systemField: 'exposureDate', systemLabel: '暴露日期', dataType: 'DateTime', length: 20, required: 1, hisField: 'EXPOSURE_DATE', hisTable: 'OCC_EXPOSURE', transformRule: '日期格式转换', specialLogic: '', validationRule: '有效日期', consistencyRisk: '', sort: 5, status: 1 },
      { scenarioId: 'occupational', systemField: 'emergencyAction', systemLabel: '应急处理', dataType: 'String', length: 200, required: 1, hisField: 'EMERGENCY_ACTION', hisTable: 'OCC_EXPOSURE', transformRule: '直接映射', specialLogic: '', validationRule: '非空', consistencyRisk: '', sort: 6, status: 1 },
      { scenarioId: 'occupational', systemField: 'riskLevel', systemLabel: '风险等级', dataType: 'Enum', length: 10, required: 1, hisField: 'RISK_LEVEL', hisTable: 'OCC_EXPOSURE', transformRule: '代码映射：1→高，2→中，3→低', specialLogic: '', validationRule: '枚举值', consistencyRisk: '风险评估标准HIS与院感可能不同', sort: 7, status: 1 },
      { scenarioId: 'occupational', systemField: 'followUpPlan', systemLabel: '随访计划', dataType: 'String', length: 200, required: 0, hisField: 'FOLLOWUP_PLAN', hisTable: 'OCC_EXPOSURE', transformRule: '直接映射', specialLogic: '', validationRule: '可选', consistencyRisk: '', sort: 8, status: 1 },
      { scenarioId: 'occupational', systemField: 'status', systemLabel: '状态', dataType: 'Enum', length: 10, required: 1, hisField: 'STATUS', hisTable: 'OCC_EXPOSURE', transformRule: '代码映射', specialLogic: '', validationRule: '枚举值', consistencyRisk: '', sort: 9, status: 1 },
    ] });

    // HisFieldMapping - antibiotic
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'antibiotic', systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: 1, hisField: 'DEPT_CODE', hisTable: 'ORDER_INFO', transformRule: '代码映射', specialLogic: '取患者所在科室', validationRule: '非空', consistencyRisk: '开单科室≠患者科室，需关联住院信息', sort: 0, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'month', systemLabel: '统计月份', dataType: 'String', length: 7, required: 1, hisField: 'ORDER_DATE', hisTable: 'ORDER_INFO', transformRule: '截取年月：YYYY-MM', specialLogic: '按月汇总统计', validationRule: 'YYYY-MM格式', consistencyRisk: '', sort: 1, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'totalPatients', systemLabel: '出院人数', dataType: 'Int', length: 6, required: 1, hisField: 'DISCHARGE_COUNT', hisTable: 'PAT_STAT', transformRule: '直接映射', specialLogic: '需排除非抗菌药物相关出院', validationRule: '正整数', consistencyRisk: 'HIS出院人数统计口径可能不同', sort: 2, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'antibioticPatients', systemLabel: '使用抗菌药物人数', dataType: 'Int', length: 6, required: 1, hisField: 'AB_USE_COUNT', hisTable: 'PAT_STAT', transformRule: '去重计数', specialLogic: '同一患者多次使用计1人', validationRule: '正整数，≤totalPatients', consistencyRisk: 'HIS去重逻辑与院感统计口径可能不同', sort: 3, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'usageRate', systemLabel: '使用率(%)', dataType: 'Float', length: 6, required: 1, hisField: 'AB_USE_RATE', hisTable: 'PAT_STAT', transformRule: '直接映射或计算', specialLogic: 'antibioticPatients/totalPatients*100', validationRule: '0-100之间的数值', consistencyRisk: 'HIS计算口径与院感统计口径需对齐', sort: 4, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'ddd', systemLabel: 'DDD值', dataType: 'Float', length: 8, required: 0, hisField: 'DDD_VALUE', hisTable: 'ORDER_INFO', transformRule: '累计DDD值', specialLogic: '需按WHO ATC/DDD索引计算', validationRule: '非负数值', consistencyRisk: 'DDD计算需参考WHO标准，HIS可能未实现', sort: 5, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'preOpProphylaxisRate', systemLabel: '术前预防用药率(%)', dataType: 'Float', length: 6, required: 0, hisField: 'PREOP_AB_RATE', hisTable: 'SURG_INFO', transformRule: '计算或直接映射', specialLogic: '仅外科科室', validationRule: '0-100之间的数值', consistencyRisk: '术前预防用药定义HIS与院感可能不同', sort: 6, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'preOpTimingRate', systemLabel: '术前0.5-2h给药率(%)', dataType: 'Float', length: 6, required: 0, hisField: 'PREOP_TIMING_RATE', hisTable: 'SURG_INFO', transformRule: '计算或直接映射', specialLogic: '需关联手术时间和给药时间', validationRule: '0-100之间的数值', consistencyRisk: '给药时间精确到分钟HIS可能未记录', sort: 7, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'postOp24hStopRate', systemLabel: '术后24h停药率(%)', dataType: 'Float', length: 6, required: 0, hisField: 'POSTOP_STOP_RATE', hisTable: 'SURG_INFO', transformRule: '计算或直接映射', specialLogic: '', validationRule: '0-100之间的数值', consistencyRisk: '术后停药时间判定逻辑复杂', sort: 8, status: 1 },
      { scenarioId: 'antibiotic', systemField: 'pathogenSendRate', systemLabel: '病原学送检率(%)', dataType: 'Float', length: 6, required: 0, hisField: 'CULTURE_SEND_RATE', hisTable: 'PAT_STAT', transformRule: '计算或直接映射', specialLogic: '使用抗菌药物前送检率', validationRule: '0-100之间的数值', consistencyRisk: '送检率计算需关联医嘱和检验申请', sort: 9, status: 1 },
    ] });

    // HisFieldMapping - hand-hygiene
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'hand-hygiene', systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: 1, hisField: 'DEPT_CODE', hisTable: 'DEPT_DICT', transformRule: '代码映射', specialLogic: '', validationRule: '非空，在科室字典中', consistencyRisk: '', sort: 0, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'month', systemLabel: '统计月份', dataType: 'String', length: 7, required: 1, hisField: 'STAT_MONTH', hisTable: 'HH_STAT', transformRule: '截取年月', specialLogic: '', validationRule: 'YYYY-MM格式', consistencyRisk: '', sort: 1, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'totalOpportunities', systemLabel: '应洗手次数', dataType: 'Int', length: 6, required: 1, hisField: 'TOTAL_OPP', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: '手工观察记录', validationRule: '正整数', consistencyRisk: 'HIS无此字段，需手工录入', sort: 2, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'compliantActions', systemLabel: '实际洗手次数', dataType: 'Int', length: 6, required: 1, hisField: 'COMPLIANT_COUNT', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: '', validationRule: '正整数，≤totalOpportunities', consistencyRisk: '', sort: 3, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'complianceRate', systemLabel: '依从率(%)', dataType: 'Float', length: 6, required: 1, hisField: 'COMPLIANCE_RATE', hisTable: 'HH_STAT', transformRule: '直接映射或计算', specialLogic: '', validationRule: '0-100之间的数值', consistencyRisk: '', sort: 4, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'beforeContact', systemLabel: '接触患者前(%)', dataType: 'Float', length: 6, required: 0, hisField: 'BEFORE_CONTACT_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之一', validationRule: '0-100之间的数值', consistencyRisk: '', sort: 5, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'beforeAseptic', systemLabel: '无菌操作前(%)', dataType: 'Float', length: 6, required: 0, hisField: 'BEFORE_ASEPTIC_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之二', validationRule: '0-100之间的数值', consistencyRisk: '', sort: 6, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'afterContact', systemLabel: '接触患者后(%)', dataType: 'Float', length: 6, required: 0, hisField: 'AFTER_CONTACT_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之三', validationRule: '0-100之间的数值', consistencyRisk: '', sort: 7, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'afterFluid', systemLabel: '体液暴露后(%)', dataType: 'Float', length: 6, required: 0, hisField: 'AFTER_FLUID_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之四', validationRule: '0-100之间的数值', consistencyRisk: '', sort: 8, status: 1 },
      { scenarioId: 'hand-hygiene', systemField: 'afterSurrounding', systemLabel: '接触周围环境后(%)', dataType: 'Float', length: 6, required: 0, hisField: 'AFTER_ENV_RATE', hisTable: 'HH_STAT', transformRule: '直接映射', specialLogic: 'WHO手卫生5时刻之五', validationRule: '0-100之间的数值', consistencyRisk: '', sort: 9, status: 1 },
    ] });

    // HisFieldMapping - warning-rule
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'warning-rule', systemField: 'name', systemLabel: '规则名称', dataType: 'String', length: 100, required: 1, hisField: 'RULE_NAME', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '非空，2-100字符', consistencyRisk: '规则名称在不同系统中可能重复', sort: 0, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'code', systemLabel: '规则编码', dataType: 'String', length: 50, required: 1, hisField: 'RULE_CODE', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '需保证唯一性', validationRule: '非空，唯一，字母+数字+下划线', consistencyRisk: 'HIS规则编码与院感编码规则需统一', sort: 1, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'category', systemLabel: '规则分类', dataType: 'Enum', length: 20, required: 1, hisField: 'RULE_CATEGORY', hisTable: 'WARNING_RULE', transformRule: '代码映射', specialLogic: '感染监测/传染病管理/环境监测/职业安全/症状监测/多重耐药菌', validationRule: '枚举值', consistencyRisk: 'HIS分类体系与院感分类可能不完全对应', sort: 2, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'ruleType', systemLabel: '规则类型', dataType: 'Enum', length: 20, required: 1, hisField: 'RULE_TYPE', hisTable: 'WARNING_RULE', transformRule: '代码映射', specialLogic: '阈值/趋势/聚集/组合/定时', validationRule: '枚举值', consistencyRisk: '', sort: 3, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'conditions', systemLabel: '触发条件', dataType: 'String', length: 2000, required: 1, hisField: 'RULE_CONDITIONS', hisTable: 'WARNING_RULE', transformRule: 'JSON格式解析', specialLogic: '条件表达式需解析为可执行逻辑', validationRule: '有效JSON格式', consistencyRisk: '条件表达式格式HIS与院感可能不同', sort: 4, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'thresholdValue', systemLabel: '阈值', dataType: 'Float', length: 10, required: 0, hisField: 'THRESHOLD_VALUE', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '数值', consistencyRisk: '', sort: 5, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'timeWindow', systemLabel: '时间窗口(分钟)', dataType: 'Int', length: 6, required: 0, hisField: 'TIME_WINDOW', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '正整数', consistencyRisk: '', sort: 6, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'warningLevel', systemLabel: '预警级别', dataType: 'Enum', length: 10, required: 1, hisField: 'WARNING_LEVEL', hisTable: 'WARNING_RULE', transformRule: '代码映射：1→低，2→中，3→高', specialLogic: '', validationRule: '枚举值', consistencyRisk: '预警级别标准HIS与院感需统一', sort: 7, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'enabled', systemLabel: '是否启用', dataType: 'Enum', length: 4, required: 1, hisField: 'ENABLED', hisTable: 'WARNING_RULE', transformRule: '0→否，1→是', specialLogic: '', validationRule: '布尔值', consistencyRisk: '', sort: 8, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'cooldownMinutes', systemLabel: '冷却时间(分钟)', dataType: 'Int', length: 6, required: 0, hisField: 'COOLDOWN_MINUTES', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '', validationRule: '非负整数', consistencyRisk: '', sort: 9, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'priority', systemLabel: '优先级', dataType: 'Int', length: 3, required: 1, hisField: 'PRIORITY', hisTable: 'WARNING_RULE', transformRule: '直接映射', specialLogic: '数字越大优先级越高', validationRule: '0-999', consistencyRisk: '', sort: 10, status: 1 },
      { scenarioId: 'warning-rule', systemField: 'targetDepts', systemLabel: '目标科室', dataType: 'String', length: 500, required: 0, hisField: 'TARGET_DEPTS', hisTable: 'WARNING_RULE', transformRule: '科室编码列表解析', specialLogic: 'JSON数组格式', validationRule: '有效JSON数组', consistencyRisk: '科室编码映射需与科室字典同步', sort: 11, status: 1 },
    ] });

    // HisFieldMapping - temperature
    await db.hisFieldMapping.createMany({ data: [
      { scenarioId: 'temperature', systemField: 'patientId', systemLabel: '患者编号', dataType: 'String', length: 20, required: 1, hisField: 'HIS_PATIENT_ID', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '住院号，关联患者基本信息', validationRule: '非空', consistencyRisk: 'HIS住院号与院感系统患者ID编码规则不一致', sort: 0, status: 1 },
      { scenarioId: 'temperature', systemField: 'patientName', systemLabel: '患者姓名', dataType: 'String', length: 50, required: 1, hisField: 'PATIENT_NAME', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '脱敏显示时仅显示姓+**', validationRule: '非空，2-50个字符', consistencyRisk: '姓名中可能含特殊字符', sort: 1, status: 1 },
      { scenarioId: 'temperature', systemField: 'temperature', systemLabel: '体温', dataType: 'Float', length: 5, required: 1, hisField: 'BODY_TEMP', hisTable: 'NURSING_RECORD', transformRule: '直接映射', specialLogic: '需统一单位为摄氏度(℃)', validationRule: '35-42℃范围内', consistencyRisk: 'HIS体温单位可能不一致（℃/℉），测量途径影响正常值范围', sort: 2, status: 1 },
      { scenarioId: 'temperature', systemField: 'measureRoute', systemLabel: '测量途径', dataType: 'Enum', length: 10, required: 1, hisField: 'MEASURE_ROUTE', hisTable: 'NURSING_RECORD', transformRule: '代码映射：1→腋下，2→口腔，3→耳温，4→肛温', specialLogic: '不同途径正常值范围不同', validationRule: '枚举值：腋下/口腔/耳温/肛温', consistencyRisk: 'HIS测量途径编码与院感枚举值需映射', sort: 3, status: 1 },
      { scenarioId: 'temperature', systemField: 'measureTime', systemLabel: '测量时间', dataType: 'DateTime', length: 20, required: 1, hisField: 'MEASURE_TIME', hisTable: 'NURSING_RECORD', transformRule: '日期格式转换', specialLogic: '精确到分钟', validationRule: '有效日期时间，不晚于当前时间', consistencyRisk: 'HIS测量时间格式可能不一致', sort: 4, status: 1 },
      { scenarioId: 'temperature', systemField: 'dept', systemLabel: '科室', dataType: 'String', length: 50, required: 1, hisField: 'DEPT_CODE', hisTable: 'PAT_VISIT', transformRule: '代码映射：HIS科室编码→院感科室名称', specialLogic: '需要科室字典映射表', validationRule: '非空，必须在科室字典中', consistencyRisk: 'HIS科室编码变更后映射表需同步更新', sort: 5, status: 1 },
      { scenarioId: 'temperature', systemField: 'bedNo', systemLabel: '床号', dataType: 'String', length: 20, required: 0, hisField: 'BED_NO', hisTable: 'PAT_VISIT', transformRule: '直接映射', specialLogic: '转科时需记录原床号', validationRule: '字母+数字格式', consistencyRisk: '转科后HIS更新床号，院感需保留测量时床号', sort: 6, status: 1 },
      { scenarioId: 'temperature', systemField: 'nurseId', systemLabel: '护士编号', dataType: 'String', length: 20, required: 0, hisField: 'NURSE_ID', hisTable: 'NURSING_RECORD', transformRule: '直接映射', specialLogic: '记录测量护士', validationRule: '可选', consistencyRisk: '', sort: 7, status: 1 },
      { scenarioId: 'temperature', systemField: 'isAbnormal', systemLabel: '是否异常体温', dataType: 'Enum', length: 4, required: 1, hisField: 'calculated', hisTable: '-', transformRule: '计算字段：temp >= 37.3 → 是', specialLogic: '根据体温值和测量途径综合判定', validationRule: '布尔值', consistencyRisk: '异常体温判定标准需与测量途径对应', sort: 8, status: 1 },
      { scenarioId: 'temperature', systemField: 'isFever', systemLabel: '是否发热', dataType: 'Enum', length: 4, required: 1, hisField: 'calculated', hisTable: '-', transformRule: '计算字段：temp >= 38.0 → 是', specialLogic: '达到发热阈值时自动上报症状监测', validationRule: '布尔值', consistencyRisk: '发热标准(≥38℃)与临床判定可能不完全一致', sort: 9, status: 1 },
    ] });

    // HisConversionRule
    await db.hisConversionRule.createMany({ data: [
      { category: '日期格式转换', sourceFormat: 'YYYYMMDD', targetFormat: 'YYYY-MM-DD', conversionFunction: 'formatDate(str, "YYYYMMDD", "YYYY-MM-DD")', example: '20240115 → 2024-01-15', sort: 0, status: 1 },
      { category: '日期格式转换', sourceFormat: 'YYYYMMDDHHmmss', targetFormat: 'YYYY-MM-DD HH:mm:ss', conversionFunction: 'formatDateTime(str, "YYYYMMDDHHmmss", "YYYY-MM-DD HH:mm:ss")', example: '20240115143025 → 2024-01-15 14:30:25', sort: 1, status: 1 },
      { category: '日期格式转换', sourceFormat: 'Unix时间戳(ms)', targetFormat: 'YYYY-MM-DD HH:mm:ss', conversionFunction: 'new Date(timestamp).toISOString()', example: '1705305025000 → 2024-01-15 06:30:25', sort: 2, status: 1 },
      { category: '日期格式转换', sourceFormat: 'YYYY/MM/DD', targetFormat: 'YYYY-MM-DD', conversionFunction: 'str.replace(/\\//g, "-")', example: '2024/01/15 → 2024-01-15', sort: 3, status: 1 },
      { category: '代码映射', sourceFormat: 'HIS性别代码(1/2/0/9)', targetFormat: '系统枚举(男/女/未知)', conversionFunction: 'mapCode(sexCode, SEX_MAP)', example: '1 → 男, 2 → 女', sort: 4, status: 1 },
      { category: '代码映射', sourceFormat: 'HIS科室编码', targetFormat: '系统科室名称', conversionFunction: 'mapCode(deptCode, DEPT_MAP)', example: 'D001 → ICU', sort: 5, status: 1 },
      { category: '代码映射', sourceFormat: 'ICD-10诊断编码', targetFormat: '感染部位枚举', conversionFunction: 'mapCode(icdCode, INFECTION_SITE_MAP)', example: 'J18.9 → 呼吸道', sort: 6, status: 1 },
      { category: '代码映射', sourceFormat: 'HIS标本类型代码', targetFormat: '系统标本枚举', conversionFunction: 'mapCode(specimenCode, SPECIMEN_MAP)', example: 'S01 → 血液, S02 → 尿液', sort: 7, status: 1 },
      { category: '代码映射', sourceFormat: 'HIS结果代码(P/N/H)', targetFormat: '系统结果(阳性/阴性/异常)', conversionFunction: 'mapCode(resultCode, RESULT_MAP)', example: 'P → 阳性, N → 阴性', sort: 8, status: 1 },
      { category: '数据类型转换', sourceFormat: 'String → Int', targetFormat: '整数类型', conversionFunction: 'parseInt(str, 10)', example: '"42" → 42', sort: 9, status: 1 },
      { category: '数据类型转换', sourceFormat: 'String → Float', targetFormat: '浮点类型', conversionFunction: 'parseFloat(str)', example: '"3.14" → 3.14', sort: 10, status: 1 },
      { category: '数据类型转换', sourceFormat: 'String → DateTime', targetFormat: '日期时间类型', conversionFunction: 'parseDate(str, format)', example: '"20240115" → Date(2024-01-15)', sort: 11, status: 1 },
      { category: '数据类型转换', sourceFormat: 'Float → String(百分比)', targetFormat: '百分比字符串', conversionFunction: '(val * 100).toFixed(2) + "%"', example: '0.85 → "85.00%"', sort: 12, status: 1 },
      { category: '数据类型转换', sourceFormat: 'String → Boolean', targetFormat: '布尔类型', conversionFunction: 'str === "1" || str.toLowerCase() === "true"', example: '"1" → true, "0" → false', sort: 13, status: 1 },
      { category: '值域映射', sourceFormat: '体温数值(℃)', targetFormat: '体温分级', conversionFunction: 'mapTemperature(temp)', example: '37.3 → 低热, 38.0 → 中度发热, 39.0 → 高热', sort: 14, status: 1 },
      { category: '值域映射', sourceFormat: '白细胞计数(×10⁹/L)', targetFormat: '异常标志', conversionFunction: 'wbc < 4 || wbc > 10 ? "异常" : "正常"', example: '3.5 → 异常, 12.0 → 异常, 7.0 → 正常', sort: 15, status: 1 },
      { category: '值域映射', sourceFormat: '药敏MIC值', targetFormat: '敏感度(S/I/R)', conversionFunction: 'interpretMIC(mic, antibiotic, breakpoint)', example: '≤2 → S, 4 → I, ≥8 → R', sort: 16, status: 1 },
      { category: '值域映射', sourceFormat: '菌落数(CFU)', targetFormat: '合格判定', conversionFunction: 'colony <= standard ? "合格" : "不合格"', example: '3 CFU/皿 → 合格(限值4), 6 CFU/皿 → 不合格', sort: 17, status: 1 },
    ] });

    // HisValidationRule
    await db.hisValidationRule.createMany({ data: [
      { form: '感染病例报告', field: 'patientId', ruleType: 'required', ruleDescription: '患者编号不能为空', errorMessage: '请输入患者编号', severity: '高', sort: 0, status: 1 },
      { form: '感染病例报告', field: 'patientName', ruleType: 'required', ruleDescription: '患者姓名不能为空', errorMessage: '请输入患者姓名', severity: '高', sort: 1, status: 1 },
      { form: '感染病例报告', field: 'infectionDate', ruleType: 'cross-field', ruleDescription: '感染日期应晚于入院日期48小时', errorMessage: '感染日期必须晚于入院日期48小时以上', severity: '高', sort: 2, status: 1 },
      { form: '感染病例报告', field: 'infectionSite', ruleType: 'required', ruleDescription: '感染部位不能为空', errorMessage: '请选择感染部位', severity: '高', sort: 3, status: 1 },
      { form: '感染病例报告', field: 'age', ruleType: 'range', ruleDescription: '年龄应在0-150之间', errorMessage: '年龄超出合理范围', severity: '中', sort: 4, status: 1 },
      { form: '感染病例报告', field: 'pathogen', ruleType: 'business', ruleDescription: '如选择病原体，需关联LIS检验结果', errorMessage: '病原体信息需与LIS结果一致', severity: '中', sort: 5, status: 1 },
      { form: '法定传染病报告', field: 'idCard', ruleType: 'format', ruleDescription: '身份证号18位格式校验', errorMessage: '身份证号格式不正确', severity: '高', sort: 6, status: 1 },
      { form: '法定传染病报告', field: 'phone', ruleType: 'format', ruleDescription: '手机号11位格式校验', errorMessage: '手机号格式不正确', severity: '中', sort: 7, status: 1 },
      { form: '法定传染病报告', field: 'reportDate', ruleType: 'business', ruleDescription: '甲类2小时内上报，乙类24小时内上报', errorMessage: '超过法定上报时限', severity: '高', sort: 8, status: 1 },
      { form: '法定传染病报告', field: 'diseaseName', ruleType: 'required', ruleDescription: '病种名称不能为空且须在法定目录中', errorMessage: '请选择法定传染病病种', severity: '高', sort: 9, status: 1 },
      { form: '法定传染病报告', field: 'diagnosisDate', ruleType: 'cross-field', ruleDescription: '诊断日期不早于发病日期', errorMessage: '诊断日期不能早于发病日期', severity: '中', sort: 10, status: 1 },
      { form: '微生物检验', field: 'specimenNo', ruleType: 'required', ruleDescription: '标本编号不能为空且唯一', errorMessage: '标本编号重复或为空', severity: '高', sort: 11, status: 1 },
      { form: '微生物检验', field: 'reportTime', ruleType: 'cross-field', ruleDescription: '报告时间晚于采集时间', errorMessage: '报告时间不能早于采集时间', severity: '中', sort: 12, status: 1 },
      { form: '微生物检验', field: 'isMDRO', ruleType: 'business', ruleDescription: 'MDRO标记需与药敏结果一致', errorMessage: 'MDRO标记与药敏结果矛盾', severity: '高', sort: 13, status: 1 },
      { form: '环境卫生监测', field: 'colonyCount', ruleType: 'range', ruleDescription: '菌落数≥0', errorMessage: '菌落数不能为负数', severity: '中', sort: 14, status: 1 },
      { form: '环境卫生监测', field: 'result', ruleType: 'business', ruleDescription: '结果需与菌落数和标准限值一致', errorMessage: '检测结果与菌落数/标准限值不一致', severity: '高', sort: 15, status: 1 },
      { form: '消毒灭菌监测', field: 'temperature', ruleType: 'range', ruleDescription: '高压蒸汽温度≥100℃', errorMessage: '高压蒸汽温度不能低于100℃', severity: '高', sort: 16, status: 1 },
      { form: '消毒灭菌监测', field: 'pressure', ruleType: 'range', ruleDescription: '高压蒸汽压力0.1-0.3MPa', errorMessage: '压力超出正常范围', severity: '高', sort: 17, status: 1 },
      { form: '职业暴露管理', field: 'exposureDate', ruleType: 'required', ruleDescription: '暴露日期不能为空', errorMessage: '请输入暴露日期', severity: '高', sort: 18, status: 1 },
      { form: '职业暴露管理', field: 'riskLevel', ruleType: 'business', ruleDescription: '风险等级需根据暴露类型和源患者评估', errorMessage: '请完善风险评估', severity: '中', sort: 19, status: 1 },
      { form: '抗菌药物使用', field: 'usageRate', ruleType: 'range', ruleDescription: '使用率0-100%', errorMessage: '使用率超出合理范围', severity: '中', sort: 20, status: 1 },
      { form: '抗菌药物使用', field: 'antibioticPatients', ruleType: 'cross-field', ruleDescription: '使用人数≤出院人数', errorMessage: '使用人数不能超过出院人数', severity: '高', sort: 21, status: 1 },
      { form: '手卫生监测', field: 'complianceRate', ruleType: 'range', ruleDescription: '依从率0-100%', errorMessage: '依从率超出合理范围', severity: '中', sort: 22, status: 1 },
      { form: '手卫生监测', field: 'compliantActions', ruleType: 'cross-field', ruleDescription: '实际洗手次数≤应洗手次数', errorMessage: '实际洗手次数不能超过应洗手次数', severity: '高', sort: 23, status: 1 },
      { form: '预警规则配置', field: 'conditions', ruleType: 'format', ruleDescription: '条件表达式需为有效JSON', errorMessage: '条件表达式JSON格式错误', severity: '高', sort: 24, status: 1 },
      { form: '预警规则配置', field: 'code', ruleType: 'required', ruleDescription: '规则编码唯一', errorMessage: '规则编码已存在', severity: '高', sort: 25, status: 1 },
      { form: '预警规则配置', field: 'thresholdValue', ruleType: 'range', ruleDescription: '阈值需为正数', errorMessage: '阈值必须为正数', severity: '中', sort: 26, status: 1 },
      { form: '体温监测对接', field: 'patientId', ruleType: 'required', ruleDescription: '患者编号不能为空', errorMessage: '请输入患者编号', severity: '高', sort: 27, status: 1 },
      { form: '体温监测对接', field: 'temperature', ruleType: 'required', ruleDescription: '体温值不能为空', errorMessage: '请输入体温值', severity: '高', sort: 28, status: 1 },
      { form: '体温监测对接', field: 'temperature', ruleType: 'range', ruleDescription: '体温值应在35-42℃范围内', errorMessage: '体温值超出合理范围(35-42℃)', severity: '高', sort: 29, status: 1 },
      { form: '体温监测对接', field: 'measureTime', ruleType: 'required', ruleDescription: '测量时间不能为空', errorMessage: '请输入测量时间', severity: '高', sort: 30, status: 1 },
      { form: '体温监测对接', field: 'dept', ruleType: 'required', ruleDescription: '科室不能为空', errorMessage: '请选择科室', severity: '高', sort: 31, status: 1 },
      { form: '体温监测对接', field: 'isFever', ruleType: 'business', ruleDescription: '体温≥38℃时自动上报症状监测', errorMessage: '发热患者未上报症状监测', severity: '高', sort: 32, status: 1 },
    ] });

    // HisConsistencyIssue
    await db.hisConsistencyIssue.createMany({ data: [
      { scenarioId: 'infection-case', field: 'dept (所有模块)', issueType: '编码映射', severity: '高', description: 'HIS科室编码与院感系统科室字典不一致，科室合并/拆分后映射表需同步更新', hisSystem: 'HIS住院系统', impactScope: '所有涉及科室字段', suggestion: '建立统一科室主数据管理(MDM)，变更时自动推送映射表更新', sort: 0, status: 1 },
      { scenarioId: 'infection-case', field: 'infectionDate (感染病例)', issueType: '时序一致', severity: '高', description: 'HIS诊断日期与院感感染日期含义不同，HIS诊断日期≠感染日期', hisSystem: 'HIS住院系统', impactScope: '感染病例报告', suggestion: '入院48h规则由院感系统判定，不直接取HIS诊断日期', sort: 1, status: 1 },
      { scenarioId: 'infection-case', field: 'age (感染病例/传染病)', issueType: '时序一致', severity: '高', description: 'HIS年龄为入院时静态值，院感需根据出生日期实时计算', hisSystem: 'HIS住院系统', impactScope: '感染病例、传染病报告', suggestion: '取HIS出生日期字段，院感系统实时计算年龄', sort: 2, status: 1 },
      { scenarioId: 'infectious-disease', field: 'onsetDate (传染病)', issueType: '数据缺失', severity: '高', description: 'HIS发病日期字段经常为空，影响传染病法定报告时效计算', hisSystem: 'HIS门诊/住院系统', impactScope: '传染病法定报告', suggestion: '通过NLP提取门诊主诉中的发病时间，或由临床补充填写', sort: 3, status: 1 },
      { scenarioId: 'infection-case', field: 'infectionSite (感染病例)', issueType: '编码映射', severity: '高', description: 'ICD-10编码与感染部位非一对一映射，需人工审核确认', hisSystem: 'HIS住院系统', impactScope: '感染病例报告', suggestion: '建立ICD-感染部位映射规则库，辅助人工判定', sort: 4, status: 1 },
      { scenarioId: 'micro-lab', field: 'organismName (微生物检验)', issueType: '系统关联', severity: '中', description: 'LIS菌名与院感菌名标准不一致（如缩写差异、亚型信息）', hisSystem: 'LIS检验系统', impactScope: '微生物检验', suggestion: '建立菌名标准化映射表，自动匹配+人工确认', sort: 5, status: 1 },
      { scenarioId: 'antibiotic', field: 'totalPatients (抗菌药物)', issueType: '统计口径', severity: '中', description: 'HIS出院人数统计口径与院感不同（是否包含转科、自动出院等）', hisSystem: 'HIS医嘱系统', impactScope: '抗菌药物使用统计', suggestion: '统一定义出院人数口径，按院感要求过滤', sort: 6, status: 1 },
      { scenarioId: 'antibiotic', field: 'usageRate, antibioticPatients (抗菌药物)', issueType: '统计口径', severity: '中', description: '抗菌药物使用率计算口径：HIS去重逻辑与院感可能不同', hisSystem: 'HIS医嘱系统', impactScope: '抗菌药物使用统计', suggestion: '明确定义去重规则：同一患者多次使用计1人', sort: 7, status: 1 },
      { scenarioId: 'infection-case', field: 'bedNo (感染病例)', issueType: '时序一致', severity: '中', description: '转科后HIS更新床号，院感需保留感染时床号', hisSystem: 'HIS住院系统', impactScope: '感染病例报告', suggestion: '感染报告创建时锁定床号快照，不随HIS更新', sort: 8, status: 1 },
      { scenarioId: 'infectious-disease', field: 'idCard (传染病)', issueType: '数据缺失', severity: '中', description: 'HIS身份证号可能缺失或格式不规范，影响传染病法定报告', hisSystem: 'HIS门诊/住院系统', impactScope: '传染病法定报告', suggestion: '门诊挂号强制采集身份证号，增加格式校验', sort: 9, status: 1 },
      { scenarioId: 'micro-lab', field: 'antibioticResult (微生物检验)', issueType: '系统关联', severity: '中', description: 'LIS药敏结果格式复杂，解析逻辑需持续维护', hisSystem: 'LIS检验系统', impactScope: '微生物检验', suggestion: '与LIS约定标准结构化输出格式，定期验证解析逻辑', sort: 10, status: 1 },
      { scenarioId: 'infection-case', field: 'gender (感染病例/传染病)', issueType: '编码映射', severity: '低', description: 'HIS性别代码与院感枚举值映射可能不完整（含未知/其他）', hisSystem: 'HIS住院系统', impactScope: '感染病例、传染病报告', suggestion: '映射表增加默认值处理，未知代码映射为"未知"', sort: 11, status: 1 },
      { scenarioId: 'sterilization', field: 'temperature (消毒灭菌)', issueType: '单位不一致', severity: '低', description: 'HIS温度可能使用华氏度，需转换为摄氏度', hisSystem: 'HIS院感系统', impactScope: '消毒灭菌监测', suggestion: '转换函数中增加单位检测和自动转换', sort: 12, status: 1 },
      { scenarioId: 'environmental', field: 'colonyCount (环境卫生)', issueType: '单位不一致', severity: '低', description: 'HIS菌落数单位可能不统一（CFU/cm² vs CFU/皿 vs CFU/m³）', hisSystem: 'HIS院感系统', impactScope: '环境卫生监测', suggestion: '根据标本类型自动选择单位转换公式', sort: 13, status: 1 },
      { scenarioId: 'infection-case', field: 'status, reviewStatus (多模块)', issueType: '流程差异', severity: '低', description: '院感审核流程与HIS审核流程独立运行，状态可能冲突', hisSystem: 'HIS住院系统', impactScope: '多模块', suggestion: '明确审核流程边界，HIS审核≠院感审核', sort: 14, status: 1 },
    ] });

    // === DictItem Seed Data ===
    const dictDefs: { category: string; code: string; name: string; color: string; sort: number }[] = [
      // 1. infection_site - 感染部位
      { category: 'infection_site', code: 'surgery_site', name: '手术部位', color: 'orange', sort: 0 },
      { category: 'infection_site', code: 'respiratory', name: '呼吸道', color: 'blue', sort: 1 },
      { category: 'infection_site', code: 'urinary', name: '泌尿道', color: 'purple', sort: 2 },
      { category: 'infection_site', code: 'bloodstream', name: '血流', color: 'rose', sort: 3 },
      { category: 'infection_site', code: 'skin', name: '皮肤软组织', color: 'amber', sort: 4 },
      { category: 'infection_site', code: 'gastrointestinal', name: '胃肠道', color: 'emerald', sort: 5 },
      // 2. infection_case_status - 感染病例状态
      { category: 'infection_case_status', code: 'pending', name: '待审核', color: 'amber', sort: 0 },
      { category: 'infection_case_status', code: 'confirmed', name: '已确认', color: 'emerald', sort: 1 },
      { category: 'infection_case_status', code: 'excluded', name: '已排除', color: 'slate', sort: 2 },
      // 3. warning_type - 预警类型
      { category: 'warning_type', code: 'case', name: '病例预警', color: 'amber', sort: 0 },
      { category: 'warning_type', code: 'cluster', name: '聚集预警', color: 'orange', sort: 1 },
      { category: 'warning_type', code: 'outbreak', name: '暴发预警', color: 'rose', sort: 2 },
      // 4. warning_status - 预警状态
      { category: 'warning_status', code: 'pending', name: '待处理', color: 'amber', sort: 0 },
      { category: 'warning_status', code: 'confirmed', name: '已确认', color: 'orange', sort: 1 },
      { category: 'warning_status', code: 'excluded', name: '已排除', color: 'slate', sort: 2 },
      { category: 'warning_status', code: 'handled', name: '已处理', color: 'emerald', sort: 3 },
      // 5. warning_level - 预警级别
      { category: 'warning_level', code: 'high', name: '高', color: 'rose', sort: 0 },
      { category: 'warning_level', code: 'medium', name: '中', color: 'orange', sort: 1 },
      { category: 'warning_level', code: 'low', name: '低', color: 'amber', sort: 2 },
      // 6. sample_type - 标本类型（环境监测）
      { category: 'sample_type', code: 'air', name: '空气', color: 'sky', sort: 0 },
      { category: 'sample_type', code: 'surface', name: '物体表面', color: 'teal', sort: 1 },
      { category: 'sample_type', code: 'hand', name: '医务人员手', color: 'violet', sort: 2 },
      // 7. env_result - 环境监测结果
      { category: 'env_result', code: 'qualified', name: '合格', color: 'emerald', sort: 0 },
      { category: 'env_result', code: 'unqualified', name: '不合格', color: 'rose', sort: 1 },
      // 8. review_status - 审核状态
      { category: 'review_status', code: 'pending', name: '待审核', color: 'amber', sort: 0 },
      { category: 'review_status', code: 'approved', name: '已审核', color: 'emerald', sort: 1 },
      { category: 'review_status', code: 'rejected', name: '退回', color: 'rose', sort: 2 },
      // 9. sterilization_method - 灭菌方法
      { category: 'sterilization_method', code: 'steam', name: '高压蒸汽', color: 'orange', sort: 0 },
      { category: 'sterilization_method', code: 'eo', name: '环氧乙烷', color: 'blue', sort: 1 },
      { category: 'sterilization_method', code: 'plasma', name: '等离子', color: 'purple', sort: 2 },
      // 10. exposure_type - 暴露类型
      { category: 'exposure_type', code: 'needle', name: '针刺伤', color: 'rose', sort: 0 },
      { category: 'exposure_type', code: 'blood', name: '血液体液暴露', color: 'orange', sort: 1 },
      { category: 'exposure_type', code: 'other', name: '其他', color: 'slate', sort: 2 },
      // 11. symptom_group - 症状群
      { category: 'symptom_group', code: 'fever', name: '发热', color: 'rose', sort: 0 },
      { category: 'symptom_group', code: 'diarrhea', name: '腹泻', color: 'amber', sort: 1 },
      { category: 'symptom_group', code: 'rash', name: '皮疹', color: 'purple', sort: 2 },
      { category: 'symptom_group', code: 'respiratory', name: '呼吸道', color: 'blue', sort: 3 },
      { category: 'symptom_group', code: 'neuro', name: '神经系统', color: 'teal', sort: 4 },
      { category: 'symptom_group', code: 'hemorrhagic', name: '出血热', color: 'red', sort: 5 },
      { category: 'symptom_group', code: 'other', name: '其他', color: 'slate', sort: 6 },
      // 12. symptom_status - 症状监测状态
      { category: 'symptom_status', code: 'pending', name: '待核实', color: 'amber', sort: 0 },
      { category: 'symptom_status', code: 'verified', name: '已核实', color: 'emerald', sort: 1 },
      { category: 'symptom_status', code: 'excluded', name: '排除', color: 'slate', sort: 2 },
      { category: 'symptom_status', code: 'alerted', name: '已预警', color: 'rose', sort: 3 },
      // 13. id_case_status - 传染病病例状态
      { category: 'id_case_status', code: 'pending', name: '待审核', color: 'amber', sort: 0 },
      { category: 'id_case_status', code: 'approved', name: '已审核', color: 'emerald', sort: 1 },
      { category: 'id_case_status', code: 'returned', name: '退回', color: 'orange', sort: 2 },
      { category: 'id_case_status', code: 'reported', name: '已上报', color: 'blue', sort: 3 },
      { category: 'id_case_status', code: 'closed', name: '已结案', color: 'slate', sort: 4 },
      // 14. id_case_severity - 传染病严重程度
      { category: 'id_case_severity', code: 'mild', name: '轻症', color: 'emerald', sort: 0 },
      { category: 'id_case_severity', code: 'moderate', name: '普通', color: 'blue', sort: 1 },
      { category: 'id_case_severity', code: 'severe', name: '重症', color: 'orange', sort: 2 },
      { category: 'id_case_severity', code: 'critical', name: '危重症', color: 'rose', sort: 3 },
      // 15. id_report_type - 报告类型
      { category: 'id_report_type', code: 'initial', name: '初次报告', color: 'blue', sort: 0 },
      { category: 'id_report_type', code: 'revision', name: '订正报告', color: 'amber', sort: 1 },
      { category: 'id_report_type', code: 'outcome', name: '转归报告', color: 'emerald', sort: 2 },
      // 16. id_isolation_type - 隔离类型
      { category: 'id_isolation_type', code: 'home', name: '居家隔离', color: 'blue', sort: 0 },
      { category: 'id_isolation_type', code: 'centralized', name: '集中隔离', color: 'orange', sort: 1 },
      { category: 'id_isolation_type', code: 'hospital', name: '住院隔离', color: 'rose', sort: 2 },
      { category: 'id_isolation_type', code: 'none', name: '无需隔离', color: 'slate', sort: 3 },
      // 17. id_outcome - 传染病转归
      { category: 'id_outcome', code: 'cured', name: '治愈', color: 'emerald', sort: 0 },
      { category: 'id_outcome', code: 'improved', name: '好转', color: 'blue', sort: 1 },
      { category: 'id_outcome', code: 'uncured', name: '未愈', color: 'amber', sort: 2 },
      { category: 'id_outcome', code: 'death', name: '死亡', color: 'rose', sort: 3 },
      { category: 'id_outcome', code: 'other', name: '其他', color: 'slate', sort: 4 },
      // 18. contact_relationship - 接触者关系
      { category: 'contact_relationship', code: 'family', name: '家属', color: 'blue', sort: 0 },
      { category: 'contact_relationship', code: 'colleague', name: '同事', color: 'emerald', sort: 1 },
      { category: 'contact_relationship', code: 'wardmate', name: '同病室', color: 'amber', sort: 2 },
      { category: 'contact_relationship', code: 'medical', name: '医护', color: 'purple', sort: 3 },
      { category: 'contact_relationship', code: 'other', name: '其他', color: 'slate', sort: 4 },
      // 19. contact_type - 接触类型
      { category: 'contact_type', code: 'close', name: '密切接触', color: 'rose', sort: 0 },
      { category: 'contact_type', code: 'general', name: '一般接触', color: 'amber', sort: 1 },
      // 20. exposure_level - 暴露级别
      { category: 'exposure_level', code: 'high', name: '高', color: 'rose', sort: 0 },
      { category: 'exposure_level', code: 'medium', name: '中', color: 'orange', sort: 1 },
      { category: 'exposure_level', code: 'low', name: '低', color: 'amber', sort: 2 },
      // 21. contact_symptom_status - 接触者症状状态
      { category: 'contact_symptom_status', code: 'asymptomatic', name: '无症状', color: 'emerald', sort: 0 },
      { category: 'contact_symptom_status', code: 'symptomatic', name: '有症状', color: 'orange', sort: 1 },
      { category: 'contact_symptom_status', code: 'confirmed', name: '已确诊', color: 'rose', sort: 2 },
      // 22. quarantine_type - 隔离类型
      { category: 'quarantine_type', code: 'home', name: '居家隔离', color: 'blue', sort: 0 },
      { category: 'quarantine_type', code: 'centralized', name: '集中隔离', color: 'orange', sort: 1 },
      { category: 'quarantine_type', code: 'self_monitor', name: '自我健康监测', color: 'emerald', sort: 2 },
      { category: 'quarantine_type', code: 'none', name: '无需隔离', color: 'slate', sort: 3 },
      // 23. test_result - 检测结果
      { category: 'test_result', code: 'untested', name: '未检测', color: 'slate', sort: 0 },
      { category: 'test_result', code: 'negative', name: '阴性', color: 'emerald', sort: 1 },
      { category: 'test_result', code: 'positive', name: '阳性', color: 'rose', sort: 2 },
      // 24. follow_up_status - 随访状态
      { category: 'follow_up_status', code: 'pending', name: '待随访', color: 'amber', sort: 0 },
      { category: 'follow_up_status', code: 'ongoing', name: '随访中', color: 'blue', sort: 1 },
      { category: 'follow_up_status', code: 'released', name: '已解除', color: 'emerald', sort: 2 },
      { category: 'follow_up_status', code: 'converted', name: '已转确诊', color: 'rose', sort: 3 },
      // 25. alert_type - 疫情预警类型
      { category: 'alert_type', code: 'notifiable', name: '法定传染病预警', color: 'rose', sort: 0 },
      { category: 'alert_type', code: 'cluster', name: '聚集性疫情预警', color: 'orange', sort: 1 },
      { category: 'alert_type', code: 'symptom', name: '症状监测预警', color: 'amber', sort: 2 },
      { category: 'alert_type', code: 'imported', name: '输入性传染病预警', color: 'blue', sort: 3 },
      // 26. alert_level - 预警级别
      { category: 'alert_level', code: 'red', name: '红色', color: 'red', sort: 0 },
      { category: 'alert_level', code: 'orange', name: '橙色', color: 'orange', sort: 1 },
      { category: 'alert_level', code: 'yellow', name: '黄色', color: 'amber', sort: 2 },
      { category: 'alert_level', code: 'blue', name: '蓝色', color: 'blue', sort: 3 },
      // 27. alert_source - 预警来源
      { category: 'alert_source', code: 'case_report', name: '病例上报', color: 'blue', sort: 0 },
      { category: 'alert_source', code: 'symptom_monitor', name: '症状监测', color: 'amber', sort: 1 },
      { category: 'alert_source', code: 'system_auto', name: '系统自动', color: 'emerald', sort: 2 },
      { category: 'alert_source', code: 'manual_report', name: '人工上报', color: 'purple', sort: 3 },
      // 28. alert_status - 预警状态
      { category: 'alert_status', code: 'pending', name: '待处理', color: 'amber', sort: 0 },
      { category: 'alert_status', code: 'processing', name: '处理中', color: 'blue', sort: 1 },
      { category: 'alert_status', code: 'handled', name: '已处理', color: 'emerald', sort: 2 },
      { category: 'alert_status', code: 'closed', name: '已关闭', color: 'slate', sort: 3 },
      // 29. rule_category - 规则分类
      { category: 'rule_category', code: 'infection', name: '感染监测', color: 'emerald', sort: 0 },
      { category: 'rule_category', code: 'infectious_disease', name: '传染病管理', color: 'blue', sort: 1 },
      { category: 'rule_category', code: 'environment', name: '环境监测', color: 'teal', sort: 2 },
      { category: 'rule_category', code: 'occupational', name: '职业安全', color: 'amber', sort: 3 },
      { category: 'rule_category', code: 'symptom', name: '症状监测', color: 'purple', sort: 4 },
      { category: 'rule_category', code: 'mdro', name: '多重耐药菌', color: 'rose', sort: 5 },
      // 30. rule_type - 规则类型
      { category: 'rule_type', code: 'threshold', name: '阈值预警', color: 'blue', sort: 0 },
      { category: 'rule_type', code: 'trend', name: '趋势预警', color: 'emerald', sort: 1 },
      { category: 'rule_type', code: 'cluster', name: '聚集预警', color: 'orange', sort: 2 },
      { category: 'rule_type', code: 'timeliness', name: '时效预警', color: 'amber', sort: 3 },
      { category: 'rule_type', code: 'composite', name: '复合规则', color: 'purple', sort: 4 },
      // 31. mdro_type - 耐药菌类型
      { category: 'mdro_type', code: 'CRAB', name: 'CRAB-鲍曼不动杆菌', color: 'rose', sort: 0 },
      { category: 'mdro_type', code: 'CRKP', name: 'CRKP-肺炎克雷伯菌', color: 'orange', sort: 1 },
      { category: 'mdro_type', code: 'MRSA', name: 'MRSA-金黄色葡萄球菌', color: 'purple', sort: 2 },
      { category: 'mdro_type', code: 'VRE', name: 'VRE-屎肠球菌', color: 'red', sort: 3 },
      { category: 'mdro_type', code: 'CRPA', name: 'CRPA-铜绿假单胞菌', color: 'teal', sort: 4 },
      // 32. specimen_type - 微生物标本类型
      { category: 'specimen_type', code: 'sputum', name: '痰液', color: 'amber', sort: 0 },
      { category: 'specimen_type', code: 'urine', name: '尿液', color: 'yellow', sort: 1 },
      { category: 'specimen_type', code: 'blood', name: '血液', color: 'red', sort: 2 },
      { category: 'specimen_type', code: 'secretion', name: '分泌物', color: 'emerald', sort: 3 },
      { category: 'specimen_type', code: 'lavage', name: '肺泡灌洗液', color: 'blue', sort: 4 },
      { category: 'specimen_type', code: 'other', name: '其他', color: 'slate', sort: 5 },
      // 33. disease_category - 传染病分类
      { category: 'disease_category', code: 'class_a', name: '甲类', color: 'red', sort: 0 },
      { category: 'disease_category', code: 'class_b', name: '乙类', color: 'orange', sort: 1 },
      { category: 'disease_category', code: 'class_c', name: '丙类', color: 'amber', sort: 2 },
      { category: 'disease_category', code: 'other', name: '其他', color: 'slate', sort: 3 },
      // 34. gender - 性别
      { category: 'gender', code: 'male', name: '男', color: 'blue', sort: 0 },
      { category: 'gender', code: 'female', name: '女', color: 'rose', sort: 1 },
      { category: 'gender', code: 'unknown', name: '未知', color: 'slate', sort: 2 },
      // 35. outcome - 转归
      { category: 'outcome', code: 'cured', name: '治愈', color: 'emerald', sort: 0 },
      { category: 'outcome', code: 'improved', name: '好转', color: 'blue', sort: 1 },
      { category: 'outcome', code: 'uncured', name: '未愈', color: 'amber', sort: 2 },
      { category: 'outcome', code: 'death', name: '死亡', color: 'rose', sort: 3 },
      // 36. occupation_status - 职业暴露状态
      { category: 'occupation_status', code: 'reported', name: '已上报', color: 'amber', sort: 0 },
      { category: 'occupation_status', code: 'assessing', name: '评估中', color: 'blue', sort: 1 },
      { category: 'occupation_status', code: 'following', name: '随访中', color: 'orange', sort: 2 },
      { category: 'occupation_status', code: 'closed', name: '已结案', color: 'emerald', sort: 3 },
      // 37. report_type - 报告类型
      { category: 'report_type', code: 'daily', name: '日报', color: 'blue', sort: 0 },
      { category: 'report_type', code: 'weekly', name: '周报', color: 'emerald', sort: 1 },
      { category: 'report_type', code: 'monthly', name: '月报', color: 'amber', sort: 2 },
      { category: 'report_type', code: 'quarterly', name: '季报', color: 'purple', sort: 3 },
      { category: 'report_type', code: 'annual', name: '年报', color: 'rose', sort: 4 },
      { category: 'report_type', code: 'special', name: '专项', color: 'teal', sort: 5 },
      // 38. report_status - 报告状态
      { category: 'report_status', code: 'draft', name: '草稿', color: 'slate', sort: 0 },
      { category: 'report_status', code: 'submitted', name: '已提交', color: 'blue', sort: 1 },
      { category: 'report_status', code: 'approved', name: '已审核', color: 'emerald', sort: 2 },
      // 39. measure_route - 体温测量途径
      { category: 'measure_route', code: 'axillary', name: '腋下', color: 'blue', sort: 0 },
      { category: 'measure_route', code: 'oral', name: '口腔', color: 'emerald', sort: 1 },
      { category: 'measure_route', code: 'rectal', name: '直肠', color: 'amber', sort: 2 },
      { category: 'measure_route', code: 'ear', name: '耳温', color: 'purple', sort: 3 },
      { category: 'measure_route', code: 'forehead', name: '额温', color: 'teal', sort: 4 },
      // 40. his_source - 数据来源
      { category: 'his_source', code: 'his_push', name: 'HIS自动推送', color: 'blue', sort: 0 },
      { category: 'his_source', code: 'nursing_input', name: '护理录入', color: 'emerald', sort: 1 },
      { category: 'his_source', code: 'device', name: '设备采集', color: 'purple', sort: 2 },
    ];
    await db.dictItem.createMany({ data: dictDefs.map(d => ({ category: d.category, code: d.code, name: d.name, color: d.color, sort: d.sort })) });

    // === SystemConfig Seed Data ===
    await db.systemConfig.createMany({ data: [
      { configKey: 'system_name', configValue: '医院感染管理系统', configType: 'string', category: 'general', description: '系统名称' },
      { configKey: 'system_version', configValue: '1.0', configType: 'string', category: 'general', description: '系统版本' },
      { configKey: 'hospital_name', configValue: 'XX医院', configType: 'string', category: 'general', description: '医院名称' },
      { configKey: 'dashboard_trend_text', configValue: '', configType: 'string', category: 'dashboard', description: '看板趋势文本（动态计算）' },
    ] });

    // === TargetMonitoringItem Seed Data ===
    await db.targetMonitoringItem.createMany({ data: [
      { title: '手术部位感染监测', description: '监测外科手术部位感染发生率', icon: 'Syringe', targetRate: 1.5, currentRate: 2.3, rateUnit: '%', category: '感染监测', sort: 0, status: 1 },
      { title: 'ICU导管相关感染监测', description: '监测ICU中心静脉导管/导尿管/呼吸机相关感染', icon: 'Activity', targetRate: 3.0, currentRate: 4.8, rateUnit: '%', category: '感染监测', sort: 1, status: 1 },
      { title: '新生儿医院感染监测', description: '监测新生儿病房医院感染发病率', icon: 'Baby', targetRate: 1.0, currentRate: 1.2, rateUnit: '%', category: '感染监测', sort: 2, status: 1 },
      { title: '多重耐药菌感染监测', description: '监测多重耐药菌检出率及感染率', icon: 'Bug', targetRate: 5.0, currentRate: 8.5, rateUnit: '%', category: '感染监测', sort: 3, status: 1 },
      { title: '抗菌药物使用率监测', description: '监测住院患者抗菌药物使用率', icon: 'Pill', targetRate: 60.0, currentRate: 45.2, rateUnit: '%', category: '抗菌药物', sort: 4, status: 1 },
      { title: '手卫生依从性监测', description: '监测医务人员手卫生依从率', icon: 'Hand', targetRate: 95.0, currentRate: 82.5, rateUnit: '%', category: '手卫生', sort: 5, status: 1 },
    ] });

    // === 传染病检验数据初始化 ===
    await generateInfectiousDiseaseWarningRules();

    // 传染病检验结果样例数据
    const idLabDepts = ['感染科','内科','外科','ICU','儿科','呼吸科','妇产科','急诊科'];
    const idLabItems = [
      { code: 'jyxx2351', name: '乙型肝炎病毒表面抗原（HBsAg）', result: '阳性', disease: '病毒性肝炎', cat: '乙类', notifiable: 1 },
      { code: 'jyxx2095', name: '人免疫缺陷病毒抗体(HIV-Ab)', result: 'HIV感染待确定', disease: '艾滋病', cat: '乙类', notifiable: 1 },
      { code: 'jyxx11874', name: '新型冠状病毒（2019-nCoV）抗原检测', result: '阳性', disease: '新型冠状病毒感染', cat: '乙类', notifiable: 1 },
      { code: 'jyxx975', name: '梅毒螺旋体抗体(Anti-TP)', result: '阳性', disease: '梅毒', cat: '乙类', notifiable: 1 },
      { code: 'jyxx841', name: '甲型流感病毒抗原', result: '阳性', disease: '流行性感冒', cat: '丙类', notifiable: 1 },
      { code: 'jyxx488', name: '淋球菌培养', result: '培养出淋球菌奈瑟氏菌生长', disease: '淋病', cat: '乙类', notifiable: 1 },
      { code: 'jyxx1464', name: '甲型肝炎病毒抗体IgM(A)', result: '阳性', disease: '病毒性肝炎', cat: '乙类', notifiable: 1 },
      { code: 'jyxx2136', name: '丙型肝炎病毒抗体(Anti-HCV)', result: '阳性', disease: '病毒性肝炎', cat: '乙类', notifiable: 1 },
    ];
    await db.infectiousDiseaseLabResult.createMany({ data: idLabItems.map((item, i) => ({
      patientId: `IDL${String(20250001 + i).padStart(8, '0')}`,
      patientName: `检验患者${i + 1}`,
      gender: i % 2 === 0 ? '男' : '女',
      age: 25 + i * 8,
      dept: idLabDepts[i % idLabDepts.length],
      bedNo: `B-${String(i + 1).padStart(3, '0')}`,
      specimenType: ['血清', '全血', '咽拭子', '血清', '咽拭子', '分泌物', '血清', '血清'][i],
      testItemCode: item.code,
      testItemName: item.name,
      resultValue: item.result,
      isAbnormal: 1,
      isPositive: 1,
      diseaseName: item.disease,
      diseaseCategory: item.cat,
      isNotifiable: item.notifiable,
      reportTimeLimit: item.cat === '甲类' ? 2 : 24,
      hisSource: 'HIS自动推送',
      warningTriggered: i < 4 ? 1 : 0,
      operator: zl.name,
      reviewer: gk.name,
      status: '已审核',
      syncStatus: '已同步',
      syncTime: new Date(),
    })) });

    // === InfectiousDiseaseTestItem Seed Data ===
    await db.infectiousDiseaseTestItem.createMany({ data: [
      { testItemCode: 'jyxx2351', testItemName: '乙型肝炎病毒表面抗原（HBsAg）', positiveResult: '阳性', diseaseName: '病毒性肝炎', diseaseCode: 'B16', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '住院隔离', testMethod: '血清学', specimenTypes: '血清,全血', warningLevel: '中', riskNote: '乙肝为乙类传染病，需24小时内报告', sort: 0, status: 1 },
      { testItemCode: 'jyxx2352', testItemName: '乙型肝炎病毒e抗原（HBeAg）', positiveResult: '阳性', diseaseName: '病毒性肝炎', diseaseCode: 'B16', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '住院隔离', testMethod: '血清学', specimenTypes: '血清', warningLevel: '中', riskNote: 'HBeAg阳性提示病毒复制活跃', sort: 1, status: 1 },
      { testItemCode: 'jyxx2353', testItemName: '丙型肝炎病毒抗体（Anti-HCV）', positiveResult: '阳性', diseaseName: '病毒性肝炎', diseaseCode: 'B17.1', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 24, testMethod: '血清学', specimenTypes: '血清', warningLevel: '中', sort: 2, status: 1 },
      { testItemCode: 'jyxx2354', testItemName: '人类免疫缺陷病毒抗体（Anti-HIV）', positiveResult: 'HIV感染待确定', diseaseName: '艾滋病', diseaseCode: 'B20', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 2, isolationType: '无需隔离', testMethod: '血清学', specimenTypes: '血清,全血', warningLevel: '高', riskNote: 'HIV初筛阳性需送确证实验室，甲类管理要求2小时报告', sort: 3, status: 1 },
      { testItemCode: 'jyxx2355', testItemName: '梅毒螺旋体抗体（TP-Ab）', positiveResult: '阳性', diseaseName: '梅毒', diseaseCode: 'A51', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 24, testMethod: '血清学', specimenTypes: '血清', warningLevel: '中', sort: 4, status: 1 },
      { testItemCode: 'jyxx2356', testItemName: '新型冠状病毒核酸检测（SARS-CoV-2 RNA）', positiveResult: '阳性', diseaseName: '新型冠状病毒感染', diseaseCode: 'U07.1', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 2, isolationType: '集中隔离', testMethod: '核酸检测', specimenTypes: '咽拭子,痰液', warningLevel: '高', riskNote: '新冠为乙类但甲类管理，2小时内报告', sort: 5, status: 1 },
      { testItemCode: 'jyxx2357', testItemName: '结核杆菌DNA检测', positiveResult: '阳性', diseaseName: '肺结核', diseaseCode: 'A15.0', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 24, isolationType: '居家隔离', testMethod: '核酸检测', specimenTypes: '痰液', warningLevel: '中', sort: 6, status: 1 },
      { testItemCode: 'jyxx2358', testItemName: '淋球菌培养', positiveResult: '培养出淋球菌奈瑟氏菌生长', diseaseName: '淋病', diseaseCode: 'A54', diseaseCategory: '乙类', isNotifiable: 1, reportTimeLimit: 24, testMethod: '培养', specimenTypes: '分泌物', warningLevel: '中', sort: 7, status: 1 },
    ] });

    // === HisInfectiousDiseaseTestMapping Seed Data ===
    await db.hisInfectiousDiseaseTestMapping.createMany({ data: [
      { hisTestCode: 'HIS-HBV-PANEL', hisTestName: '乙肝五项检测', subItemNo: 1, testItemCode: 'jyxx2351', testItemName: '乙型肝炎病毒表面抗原（HBsAg）', transformRule: 'HIS阳性/阴性→系统阳性/阴性', specialLogic: 'HIS组合项目中第1子项对应HBsAg', consistencyRisk: 'HIS组合项目与系统单项的对应关系需确认', sort: 0, status: 1 },
      { hisTestCode: 'HIS-HBV-PANEL', hisTestName: '乙肝五项检测', subItemNo: 3, testItemCode: 'jyxx2352', testItemName: '乙型肝炎病毒e抗原（HBeAg）', transformRule: 'HIS阳性/阴性→系统阳性/阴性', specialLogic: 'HIS组合项目中第3子项对应HBeAg', consistencyRisk: '子项序号映射关系需定期核对', sort: 1, status: 1 },
      { hisTestCode: 'HIS-HCV-AB', hisTestName: '丙肝抗体检测', subItemNo: 1, testItemCode: 'jyxx2353', testItemName: '丙型肝炎病毒抗体（Anti-HCV）', transformRule: 'HIS Reactive/Non-reactive→系统阳性/阴性', specialLogic: 'HIS使用英文结果，需转换为中文', consistencyRisk: 'HIS结果格式与系统不一致，需转换', sort: 2, status: 1 },
      { hisTestCode: 'HIS-HIV-AB', hisTestName: 'HIV抗体初筛', subItemNo: 1, testItemCode: 'jyxx2354', testItemName: '人类免疫缺陷病毒抗体（Anti-HIV）', transformRule: 'HIS Reactive→系统HIV感染待确定', specialLogic: 'HIS初筛阳性需自动创建预警', consistencyRisk: '初筛阳性≠确证阳性，需标注待确定', sort: 3, status: 1 },
      { hisTestCode: 'HIS-TP-AB', hisTestName: '梅毒抗体检测', subItemNo: 1, testItemCode: 'jyxx2355', testItemName: '梅毒螺旋体抗体（TP-Ab）', transformRule: '直接映射', consistencyRisk: '低', sort: 4, status: 1 },
      { hisTestCode: 'HIS-COVID-PCR', hisTestName: '新冠核酸检测', subItemNo: 1, testItemCode: 'jyxx2356', testItemName: '新型冠状病毒核酸检测（SARS-CoV-2 RNA）', transformRule: 'HIS Detected/Not Detected→系统阳性/阴性', specialLogic: '阳性结果需立即触发甲类管理预警', consistencyRisk: 'HIS结果表述与系统不同，需标准转换', sort: 5, status: 1 },
      { hisTestCode: 'HIS-TB-DNA', hisTestName: '结核杆菌核酸检测', subItemNo: 1, testItemCode: 'jyxx2357', testItemName: '结核杆菌DNA检测', transformRule: '直接映射', consistencyRisk: '低', sort: 6, status: 1 },
      { hisTestCode: 'HIS-NG-CULTURE', hisTestName: '淋球菌培养', subItemNo: 1, testItemCode: 'jyxx2358', testItemName: '淋球菌培养', transformRule: 'HIS培养结果→系统阳性判定', specialLogic: 'HIS培养结果描述格式需标准化', consistencyRisk: 'HIS培养结果描述可能不一致', sort: 7, status: 1 },
    ] });

    return NextResponse.json({ success: true, message: '数据库初始化成功', data: { users: 5, roles: 3, permissions: permissionDefs.length, menus: menuDefs.length } });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
