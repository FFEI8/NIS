import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const R = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export async function POST() {
  try {
    if ((await db.user.count()) > 0) {
      return NextResponse.json({ success: true, message: '数据已存在，跳过初始化', data: { skipped: true } });
    }

    // Clean tables
    const tables = [
      db.userRole, db.rolePermission, db.roleMenu,
      db.infectionCase, db.warningRecord, db.environmentalMonitor, db.sterilizationMonitor,
      db.occupationalExposure, db.antibioticUsage, db.handHygiene, db.infectionReport,
      db.contactTracing, db.symptomSurveillance, db.diseaseAlert, db.infectiousDiseaseCase,
      db.warningRule, db.microLabResult, db.warningRuleLog, db.temperatureRecord,
      db.user, db.role, db.permission, db.menu,
    ];
    for (const t of tables) await t.deleteMany();

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
      { name: '数据分析', code: 'data-analysis', icon: 'BarChart3', type: 'directory', sort: 3 },
      { name: '统计分析', code: 'data-statistics', path: '/data/statistics', icon: 'PieChart', type: 'menu', parentCode: 'data-analysis', sort: 0 },
      { name: '感染报告', code: 'data-report', path: '/data/reports', icon: 'FileSpreadsheet', type: 'menu', parentCode: 'data-analysis', sort: 1 },
      { name: 'HIS对接分析', code: 'his-integration', path: '/integration/his-analysis', icon: 'GitMerge', type: 'menu', parentCode: 'data-analysis', sort: 2 },
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

    const icPerms = allPerms.filter(p => /^(infection:|id:|warning:|micro:|system:role:|system:menu:|integration:)/.test(p.code)).map(p => p.id);
    await db.rolePermission.createMany({ data: icPerms.map(pid => ({ roleId: infectionCtrl.id, permissionId: pid })) });
    const icMenuCodes = ['dashboard','infection-monitor','infection-case','infection-warning','infection-warning-rules','micro-lab-results','infection-target','infectious-disease','id-case-report','id-contact-tracing','id-symptom-surveillance','id-epidemic-dashboard','id-disease-alert','data-analysis','data-statistics','data-report','his-integration','env-monitor','env-hygiene','env-sterilization','occupational-safety','occupational-exposure','hand-hygiene','antibiotic'];
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

    return NextResponse.json({ success: true, message: '数据库初始化成功', data: { users: 5, roles: 3, permissions: permissionDefs.length, menus: menuDefs.length } });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
