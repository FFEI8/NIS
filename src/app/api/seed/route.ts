import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Check if data already exists - skip seed if users table has data
    const existingUsers = await db.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ success: true, message: '数据已存在，跳过初始化', data: { skipped: true } });
    }

    // Clean all tables in correct order (respecting foreign keys)
    await db.userRole.deleteMany();
    await db.rolePermission.deleteMany();
    await db.roleMenu.deleteMany();
    await db.infectionCase.deleteMany();
    await db.warningRecord.deleteMany();
    await db.environmentalMonitor.deleteMany();
    await db.sterilizationMonitor.deleteMany();
    await db.occupationalExposure.deleteMany();
    await db.antibioticUsage.deleteMany();
    await db.handHygiene.deleteMany();
    await db.infectionReport.deleteMany();
    await db.contactTracing.deleteMany();
    await db.symptomSurveillance.deleteMany();
    await db.diseaseAlert.deleteMany();
    await db.infectiousDiseaseCase.deleteMany();
    await db.warningRule.deleteMany();
    await db.microLabResult.deleteMany();
    await db.warningRuleLog.deleteMany();
    await db.user.deleteMany();
    await db.role.deleteMany();
    await db.permission.deleteMany();
    await db.menu.deleteMany();

    // ========== Create Permissions (batch) ==========
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
      // 传染病管理模块权限
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
      // 预警规则管理权限
      { code: 'warning:rule:list', name: '预警规则列表', type: 'menu', module: '感染监测' },
      { code: 'warning:rule:add', name: '新增预警规则', type: 'button', module: '感染监测' },
      { code: 'warning:rule:edit', name: '编辑预警规则', type: 'button', module: '感染监测' },
      { code: 'warning:rule:delete', name: '删除预警规则', type: 'button', module: '感染监测' },
      { code: 'warning:rule:toggle', name: '启用/禁用规则', type: 'button', module: '感染监测' },
      // 微生物检验权限
      { code: 'micro:lab:list', name: '微生物检验列表', type: 'menu', module: '感染监测' },
      { code: 'micro:lab:add', name: '新增微生物检验', type: 'button', module: '感染监测' },
      { code: 'micro:lab:import', name: '导入微生物数据', type: 'button', module: '感染监测' },
    ];

    const permissions = await db.permission.createMany({
      data: permissionDefs.map((p, i) => ({ ...p, sort: i })),
    });

    // Get created permissions for role assignment
    const allPermissions = await db.permission.findMany();

    // ========== Create Menus (parent menus first) ==========
    // Sort values adjusted: 传染病管理 inserted at sort 2 (between 感染监测=1 and 数据分析=3)
    const menuDefs = [
      { name: '首页', code: 'dashboard', path: '/dashboard', icon: 'LayoutDashboard', type: 'menu', sort: 0 },
      { name: '感染监测', code: 'infection-monitor', icon: 'Activity', type: 'directory', sort: 1 },
      { name: '感染病例', code: 'infection-case', path: '/infection/cases', icon: 'FileText', type: 'menu', parentCode: 'infection-monitor', sort: 0 },
      { name: '智能预警', code: 'infection-warning', path: '/infection/warnings', icon: 'AlertTriangle', type: 'menu', parentCode: 'infection-monitor', sort: 1 },
      { name: '预警规则', code: 'infection-warning-rules', path: '/infection/warning-rules', icon: 'Settings2', type: 'menu', parentCode: 'infection-monitor', sort: 2 },
      { name: '微生物检验', code: 'micro-lab-results', path: '/infection/micro-lab', icon: 'Microscope', type: 'menu', parentCode: 'infection-monitor', sort: 3 },
      { name: '目标监测', code: 'infection-target', path: '/infection/target', icon: 'Target', type: 'menu', parentCode: 'infection-monitor', sort: 4 },
      // 传染病管理 (between infection-monitor=1 and data-analysis=3)
      { name: '传染病管理', code: 'infectious-disease', icon: 'Biohazard', type: 'directory', sort: 2 },
      { name: '病例上报', code: 'id-case-report', path: '/infectious-disease/case-report', icon: 'Syringe', type: 'menu', parentCode: 'infectious-disease', sort: 0 },
      { name: '接触者追踪', code: 'id-contact-tracing', path: '/infectious-disease/contact-tracing', icon: 'Network', type: 'menu', parentCode: 'infectious-disease', sort: 1 },
      { name: '症状监测', code: 'id-symptom-surveillance', path: '/infectious-disease/symptom-surveillance', icon: 'Thermometer', type: 'menu', parentCode: 'infectious-disease', sort: 2 },
      { name: '疫情看板', code: 'id-epidemic-dashboard', path: '/infectious-disease/dashboard', icon: 'BarChart3', type: 'menu', parentCode: 'infectious-disease', sort: 3 },
      { name: '传染病预警', code: 'id-disease-alert', path: '/infectious-disease/alert', icon: 'AlertTriangle', type: 'menu', parentCode: 'infectious-disease', sort: 4 },
      // Remaining menus shifted up by 1
      { name: '数据分析', code: 'data-analysis', icon: 'BarChart3', type: 'directory', sort: 3 },
      { name: '统计分析', code: 'data-statistics', path: '/data/statistics', icon: 'PieChart', type: 'menu', parentCode: 'data-analysis', sort: 0 },
      { name: '感染报告', code: 'data-report', path: '/data/reports', icon: 'FileSpreadsheet', type: 'menu', parentCode: 'data-analysis', sort: 1 },
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

    // Create parent menus first, then children
    const menuMap = new Map<string, string>();
    const parentMenus = menuDefs.filter(d => !d.parentCode);
    const childMenus = menuDefs.filter(d => d.parentCode);

    for (const def of parentMenus) {
      const m = await db.menu.create({
        data: {
          name: def.name, code: def.code, path: def.path || null,
          icon: def.icon || null, type: def.type, sort: def.sort, visible: 1, status: 1,
        },
      });
      menuMap.set(def.code, m.id);
    }

    for (const def of childMenus) {
      const parentId = menuMap.get(def.parentCode!) || null;
      const m = await db.menu.create({
        data: {
          parentId, name: def.name, code: def.code, path: def.path || null,
          icon: def.icon || null, type: def.type, sort: def.sort, visible: 1, status: 1,
        },
      });
      menuMap.set(def.code, m.id);
    }

    const allMenus = await db.menu.findMany();

    // ========== Create Roles ==========
    const superAdmin = await db.role.create({ data: { code: 'super_admin', name: '超级管理员', description: '拥有系统所有权限', sort: 0, status: 1 } });
    const infectionControl = await db.role.create({ data: { code: 'infection_control', name: '感控专员', description: '感染管理相关权限', sort: 1, status: 1 } });
    const clinicalDoctor = await db.role.create({ data: { code: 'clinical_doctor', name: '临床医师', description: '基本查看和上报权限', sort: 2, status: 1 } });

    // Assign all permissions & menus to super admin
    await db.rolePermission.createMany({ data: allPermissions.map(p => ({ roleId: superAdmin.id, permissionId: p.id })) });
    await db.roleMenu.createMany({ data: allMenus.map(m => ({ roleId: superAdmin.id, menuId: m.id })) });

    // Assign infection + infectious disease permissions to infection control
    const infectionPermIds = allPermissions.filter(p =>
      p.code.startsWith('infection:') ||
      p.code.startsWith('id:') ||
      p.code.startsWith('warning:') ||
      p.code.startsWith('micro:') ||
      p.code.startsWith('system:role:') ||
      p.code.startsWith('system:menu:')
    ).map(p => p.id);
    await db.rolePermission.createMany({ data: infectionPermIds.map(pid => ({ roleId: infectionControl.id, permissionId: pid })) });
    const infectionMenuIds = allMenus.filter(m => [
      'dashboard', 'infection-monitor', 'infection-case', 'infection-warning', 'infection-warning-rules', 'micro-lab-results', 'infection-target',
      'infectious-disease', 'id-case-report', 'id-contact-tracing', 'id-symptom-surveillance', 'id-epidemic-dashboard', 'id-disease-alert',
      'data-analysis', 'data-statistics', 'data-report',
      'env-monitor', 'env-hygiene', 'env-sterilization',
      'occupational-safety', 'occupational-exposure', 'hand-hygiene', 'antibiotic',
    ].includes(m.code)).map(m => m.id);
    await db.roleMenu.createMany({ data: infectionMenuIds.map(mid => ({ roleId: infectionControl.id, menuId: mid })) });

    // Assign basic permissions to clinical doctor (case list/add, symptom list/add, dashboard view)
    const clinicalPermIds = allPermissions.filter(p => [
      'infection:case:list', 'infection:case:add',
      'infection:warning:list', 'infection:exposure:list', 'infection:exposure:add', 'infection:handhygiene:list',
      'id:case:list', 'id:case:add', 'id:symptom:list', 'id:symptom:add', 'id:dashboard:view',
    ].includes(p.code)).map(p => p.id);
    await db.rolePermission.createMany({ data: clinicalPermIds.map(pid => ({ roleId: clinicalDoctor.id, permissionId: pid })) });
    const clinicalMenuIds = allMenus.filter(m => [
      'dashboard', 'infection-monitor', 'infection-case', 'infection-warning',
      'occupational-safety', 'occupational-exposure', 'hand-hygiene',
      'infectious-disease', 'id-case-report', 'id-symptom-surveillance', 'id-epidemic-dashboard',
    ].includes(m.code)).map(m => m.id);
    await db.roleMenu.createMany({ data: clinicalMenuIds.map(mid => ({ roleId: clinicalDoctor.id, menuId: mid })) });

    // ========== Create Users ==========
    const adminUser = await db.user.create({ data: { username: 'admin', password: 'admin123', name: '系统管理员', dept: '信息科', status: 1 } });
    const gkUser = await db.user.create({ data: { username: 'gkzj', password: '123456', name: '张感控', dept: '感控科', status: 1 } });
    const lsUser = await db.user.create({ data: { username: 'doctor', password: '123456', name: '李医生', dept: '内科', status: 1 } });
    const wmUser = await db.user.create({ data: { username: 'nurse', password: '123456', name: '王护士', dept: '外科', status: 1 } });
    const zlUser = await db.user.create({ data: { username: 'zljc', password: '123456', name: '赵检验', dept: '检验科', status: 1 } });

    await db.userRole.createMany({ data: [
      { userId: adminUser.id, roleId: superAdmin.id },
      { userId: gkUser.id, roleId: infectionControl.id },
      { userId: lsUser.id, roleId: clinicalDoctor.id },
      { userId: wmUser.id, roleId: clinicalDoctor.id },
      { userId: zlUser.id, roleId: infectionControl.id },
    ] });

    // ========== Create Sample Data (batch) ==========
    const depts = ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '血液科', '肿瘤科'];
    const sites = ['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道', '中枢神经'];
    const pathogens = ['大肠埃希菌', '金黄色葡萄球菌', '耐甲氧西林金黄色葡萄球菌(MRSA)', '铜绿假单胞菌', '肺炎克雷伯菌', '耐碳青霉烯类肺炎克雷伯菌(CRKP)', '鲍曼不动杆菌', '白色念珠菌', '表皮葡萄球菌', '阴沟肠杆菌'];
    const outcomes = ['治愈', '好转', '未愈', '死亡'];
    const statuses = ['待审核', '已确认', '已排除'];

    // Infection cases (batch)
    const infectionCasesData = Array.from({ length: 25 }, (_, i) => {
      const infectionDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const admissionDate = new Date(infectionDate.getTime() - Math.random() * 30 * 86400000);
      return {
        patientId: `P${String(20240001 + i).padStart(8, '0')}`,
        patientName: `${['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'][i % 10]}${['明', '华', '强', '丽', '伟', '芳', '军', '秀', '杰', '敏'][i % 10]}${['', '一', '二', '三'][i % 4]}`,
        gender: i % 3 === 0 ? '女' : '男',
        age: 20 + Math.floor(Math.random() * 60),
        dept: depts[i % depts.length],
        bedNo: `${Math.floor(i / 5) + 1}${String((i % 8) + 1).padStart(2, '0')}`,
        admissionDate,
        infectionDate,
        infectionSite: sites[i % sites.length],
        infectionType: '院内感染',
        pathogen: pathogens[i % pathogens.length],
        outcome: i % 5 === 0 ? null : outcomes[i % outcomes.length],
        reporter: [gkUser.name, lsUser.name, wmUser.name][i % 3],
        status: statuses[i % 3],
      };
    });
    await db.infectionCase.createMany({ data: infectionCasesData });

    // Warnings (batch)
    const warningData = Array.from({ length: 15 }, (_, i) => ({
      patientId: `P${String(20240030 + i).padStart(8, '0')}`,
      patientName: `${['孙', '周', '吴', '郑', '冯', '褚', '卫', '蒋'][i % 8]}${['文', '武', '成', '康', '德', '建', '国', '安'][i % 8]}`,
      dept: depts[i % depts.length],
      warningType: ['病例预警', '聚集预警', '暴发预警'][i % 3],
      warningLevel: ['高', '中', '低'][i % 3],
      description: [
        '患者体温持续升高，白细胞计数异常，疑似院内感染',
        '同一病区3天内出现2例相同病原体感染，存在聚集风险',
        'ICU检出多重耐药菌，需关注传播风险',
        '手术部位出现红肿热痛，疑似手术部位感染',
        '导尿管相关尿路感染预警，需评估导管必要性',
        '呼吸机相关肺炎预警，患者新发肺部浸润影',
        '同一科室感染发病率超出阈值，存在暴发风险',
        '血流感染预警，血培养阳性结果',
      ][i % 8],
      status: ['待处理', '已确认', '已排除', '已处理'][i % 4],
      handler: i % 2 === 0 ? gkUser.name : null,
      handleResult: i % 4 === 0 ? '已确认感染，启动防控措施' : i % 4 === 1 ? '排除感染，为其他原因导致' : null,
      handleTime: i % 2 === 0 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
    }));
    await db.warningRecord.createMany({ data: warningData });

    // Environmental monitors (batch)
    const sampleTypes = ['空气', '物体表面', '医务人员手'];
    const samplePoints = ['手术室', 'ICU', '产房', '新生儿室', '供应室', '治疗室', '换药室'];
    const envData = Array.from({ length: 20 }, (_, i) => {
      const isQualified = Math.random() > 0.2;
      return {
        dept: samplePoints[i % samplePoints.length],
        samplePoint: samplePoints[i % samplePoints.length],
        sampleType: sampleTypes[i % 3],
        sampleDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        sampler: [zlUser.name, wmUser.name][i % 2],
        result: isQualified ? '合格' : '不合格',
        colonyCount: isQualified ? Math.floor(Math.random() * 3) + 0.5 : Math.floor(Math.random() * 10) + 5,
        standardLimit: sampleTypes[i % 3] === '空气' ? 4 : sampleTypes[i % 3] === '物体表面' ? 5 : 10,
        reviewer: i % 3 === 0 ? gkUser.name : null,
        reviewStatus: i % 5 === 0 ? '待审核' : i % 3 === 0 ? '退回' : '已审核',
        reviewComment: i % 3 === 0 ? '请重新采样检测' : null,
      };
    });
    await db.environmentalMonitor.createMany({ data: envData });

    // Sterilization monitors (batch)
    const methods = ['高压蒸汽', '环氧乙烷', '等离子'];
    const sterData = Array.from({ length: 12 }, (_, i) => {
      const isQualified = Math.random() > 0.1;
      return {
        batchNo: `SM${String(2024001 + i).padStart(7, '0')}`,
        sterilizer: `灭菌器${Math.floor(i / 3) + 1}号`,
        method: methods[i % 3],
        temperature: methods[i % 3] === '高压蒸汽' ? 121 + Math.random() * 13 : null,
        pressure: methods[i % 3] === '高压蒸汽' ? 0.1 + Math.random() * 0.1 : null,
        duration: methods[i % 3] === '高压蒸汽' ? 20 + Math.random() * 10 : methods[i % 3] === '环氧乙烷' ? 120 + Math.random() * 60 : 30 + Math.random() * 20,
        operator: wmUser.name,
        sterilizeDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        bioResult: isQualified ? '合格' : '不合格',
        chemResult: isQualified ? '合格' : '不合格',
        status: isQualified ? '合格' : '不合格',
      };
    });
    await db.sterilizationMonitor.createMany({ data: sterData });

    // Occupational exposures (batch)
    const exposureTypes = ['针刺伤', '血液体液暴露', '其他'];
    const expStatuses = ['已上报', '评估中', '随访中', '已结案'];
    const expData = Array.from({ length: 10 }, (_, i) => ({
      staffName: `${['钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚'][i]}${['护士', '医生', '技师', '护理员'][i % 4]}`,
      staffDept: depts[i % depts.length],
      exposureType: exposureTypes[i % 3],
      exposureSource: `患者P${String(20240050 + i).padStart(8, '0')}`,
      exposurePart: ['左手食指', '右手前臂', '左眼结膜', '口腔黏膜'][i % 4],
      exposureDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      emergencyAction: ['立即挤压伤口并冲洗', '立即冲洗消毒', '立即冲洗并报告', '紧急处理后报告'][i % 4],
      riskLevel: ['高', '中', '低'][i % 3],
      followUpPlan: i % 2 === 0 ? '随访3个月，检测HBV、HCV、HIV' : '随访6个月，定期检测',
      followUpResult: i % 4 === 0 ? '随访期未发现感染' : null,
      status: expStatuses[i % 4],
    }));
    await db.occupationalExposure.createMany({ data: expData });

    // Antibiotic usage (batch)
    const abDepts = ['ICU', '外科', '内科', '儿科', '妇产科'];
    const abData: any[] = [];
    for (let m = 7; m <= 12; m++) {
      for (const dept of abDepts) {
        const totalPatients = 80 + Math.floor(Math.random() * 120);
        const rate = dept === 'ICU' ? 60 + Math.random() * 20 : dept === '外科' ? 40 + Math.random() * 15 : 25 + Math.random() * 15;
        const antibioticPatients = Math.round(totalPatients * rate / 100);
        abData.push({
          dept,
          month: `2024-${String(m).padStart(2, '0')}`,
          totalPatients,
          antibioticPatients,
          usageRate: Math.round(rate * 100) / 100,
          ddd: dept === 'ICU' ? 80 + Math.random() * 40 : 30 + Math.random() * 30,
          preOpProphylaxisRate: dept === '外科' ? 85 + Math.random() * 10 : null,
          preOpTimingRate: dept === '外科' ? 75 + Math.random() * 15 : null,
          postOp24hStopRate: dept === '外科' ? 60 + Math.random() * 20 : null,
          pathogenSendRate: 30 + Math.random() * 30,
        });
      }
    }
    await db.antibioticUsage.createMany({ data: abData });

    // Hand hygiene (batch)
    const hhDepts = ['ICU', '外科', '内科', '儿科', '妇产科'];
    const hhData: any[] = [];
    for (let m = 7; m <= 12; m++) {
      for (const dept of hhDepts) {
        const total = 200 + Math.floor(Math.random() * 300);
        const baseRate = dept === 'ICU' ? 80 + Math.random() * 10 : 65 + Math.random() * 20;
        const compliant = Math.round(total * baseRate / 100);
        hhData.push({
          dept,
          month: `2024-${String(m).padStart(2, '0')}`,
          totalOpportunities: total,
          compliantActions: compliant,
          complianceRate: Math.round(baseRate * 100) / 100,
          beforeContact: Math.round((baseRate - 5 + Math.random() * 10) * 100) / 100,
          beforeAseptic: Math.round((baseRate + 5) * 100) / 100,
          afterContact: Math.round((baseRate + 3 + Math.random() * 5) * 100) / 100,
          afterFluid: Math.round((baseRate + 8) * 100) / 100,
          afterSurrounding: Math.round((baseRate - 8 + Math.random() * 5) * 100) / 100,
        });
      }
    }
    await db.handHygiene.createMany({ data: hhData });

    // Infection reports (batch)
    const reportData = [
      { title: '2024年7月医院感染监测月报', type: '月报', period: '2024-07', content: '## 感染监测报告\n\n本周期共监测住院患者XXX人次，发生医院感染XX例次，医院感染发病率X.XX%。\n\n### 重点指标\n- 抗菌药物使用率：XX.X%\n- 手卫生依从率：XX.X%\n- 多重耐药菌检出率：XX.X%\n\n### 建议\n1. 加强手卫生管理\n2. 规范抗菌药物使用\n3. 强化重点科室感染防控', author: gkUser.name, status: '草稿' },
      { title: '2024年第三季度感染监测季报', type: '季报', period: '2024-Q3', content: '## 第三季度感染监测季报\n\n汇总本季度感染监测数据及分析。', author: gkUser.name, status: '已提交' },
      { title: 'ICU多重耐药菌专项分析报告', type: '专项', period: '2024-ICU-MDRO', content: '## ICU多重耐药菌专项分析\n\nICU科室MDRO检出率及防控建议。', author: gkUser.name, status: '已审核' },
      { title: '2024年8月医院感染监测月报', type: '月报', period: '2024-08', content: '## 8月感染监测月报', author: gkUser.name, status: '草稿' },
      { title: '手术部位感染专项调查报告', type: '专项', period: '2024-SSI', content: '## SSI专项调查报告', author: gkUser.name, status: '已提交' },
      { title: '2024年9月医院感染监测月报', type: '月报', period: '2024-09', content: '## 9月感染监测月报', author: gkUser.name, status: '草稿' },
    ];
    await db.infectionReport.createMany({ data: reportData });

    // ========== 传染病管理模块 - Sample Data ==========

    // InfectiousDiseaseCase (15 records)
    const idCaseData = [
      {
        patientId: 'ID20240001', patientName: '王建国', gender: '男', age: 45,
        idCard: '110101197901121234', phone: '13800123001', address: '北京市朝阳区建国路88号',
        dept: '感染科', bedNo: 'ID-01',
        admissionDate: new Date(2024, 0, 15), onsetDate: new Date(2024, 0, 12),
        diagnosisDate: new Date(2024, 0, 16), reportDate: new Date(2024, 0, 16),
        diseaseName: '霍乱', diseaseCode: 'A00.9', diseaseCategory: '甲类',
        reportType: '初次报告', infectionSource: '不洁饮食',
        clinicalDiagnosis: '霍乱（小川型）', labResult: '粪便培养阳性（O1群小川型）',
        severity: '重症', outcome: '治愈', outcomeDate: new Date(2024, 0, 28),
        isolationType: '住院隔离', isolationDate: new Date(2024, 0, 16),
        reporter: gkUser.name, reviewer: gkUser.name, reviewComment: '信息完整，已确认上报',
        status: '已上报', reportToCDC: 1, reportToCDCTime: new Date(2024, 0, 16),
      },
      {
        patientId: 'ID20240002', patientName: '李秀英', gender: '女', age: 32,
        idCard: '320102199203054321', phone: '13900123002', address: '南京市鼓楼区中山路12号',
        dept: '感染科', bedNo: 'ID-02',
        admissionDate: new Date(2024, 1, 3), onsetDate: new Date(2024, 1, 1),
        diagnosisDate: new Date(2024, 1, 4), reportDate: new Date(2024, 1, 4),
        diseaseName: '鼠疫', diseaseCode: 'A20.9', diseaseCategory: '甲类',
        reportType: '初次报告', infectionSource: '接触旱獭',
        clinicalDiagnosis: '腺鼠疫', labResult: '淋巴结穿刺液培养阳性',
        severity: '危重症', outcome: '好转', outcomeDate: new Date(2024, 2, 10),
        isolationType: '住院隔离', isolationDate: new Date(2024, 1, 4),
        reporter: lsUser.name, reviewer: gkUser.name, reviewComment: '甲类传染病，2小时内上报',
        status: '已上报', reportToCDC: 1, reportToCDCTime: new Date(2024, 1, 4),
      },
      {
        patientId: 'ID20240003', patientName: '张明华', gender: '男', age: 58,
        idCard: '440103196608075678', phone: '13700123003', address: '广州市越秀区人民路56号',
        dept: '呼吸科', bedNo: 'R-15',
        admissionDate: new Date(2024, 2, 10), onsetDate: new Date(2024, 2, 7),
        diagnosisDate: new Date(2024, 2, 12), reportDate: new Date(2024, 2, 12),
        diseaseName: '新型冠状病毒感染', diseaseCode: 'U07.1', diseaseCategory: '乙类',
        reportType: '初次报告', infectionSource: '社区获得性',
        clinicalDiagnosis: '新型冠状病毒感染（普通型）', labResult: '核酸阳性，Ct值25.3',
        severity: '普通', outcome: '治愈', outcomeDate: new Date(2024, 2, 25),
        isolationType: '住院隔离', isolationDate: new Date(2024, 2, 10),
        reporter: lsUser.name, reviewer: gkUser.name, reviewComment: '已按乙类传染病管理要求上报',
        status: '已审核', reportToCDC: 1, reportToCDCTime: new Date(2024, 2, 12),
      },
      {
        patientId: 'ID20240004', patientName: '陈伟强', gender: '男', age: 42,
        idCard: '510104198205098901', phone: '13600123004', address: '成都市锦江区春熙路99号',
        dept: '感染科', bedNo: 'ID-03',
        admissionDate: new Date(2024, 3, 5), onsetDate: new Date(2024, 3, 1),
        diagnosisDate: new Date(2024, 3, 6), reportDate: new Date(2024, 3, 7),
        diseaseName: '肺结核', diseaseCode: 'A15.0', diseaseCategory: '乙类',
        reportType: '初次报告', infectionSource: '密切接触史',
        clinicalDiagnosis: '继发性肺结核（涂阳）', labResult: '痰涂片抗酸杆菌阳性（+++），GeneXpert：MTB检出，利福平耐药',
        severity: '普通', outcome: '好转', outcomeDate: null,
        isolationType: '住院隔离', isolationDate: new Date(2024, 3, 6),
        reporter: lsUser.name, reviewer: gkUser.name, reviewComment: '耐多药肺结核，需加强隔离管理',
        status: '已审核', reportToCDC: 1, reportToCDCTime: new Date(2024, 3, 7),
      },
      {
        patientId: 'ID20240005', patientName: '赵丽芳', gender: '女', age: 35,
        idCard: '330102198908112345', phone: '13500123005', address: '杭州市上城区解放路78号',
        dept: '感染科', bedNo: 'ID-04',
        admissionDate: new Date(2024, 3, 20), onsetDate: new Date(2024, 3, 15),
        diagnosisDate: new Date(2024, 3, 22), reportDate: new Date(2024, 3, 22),
        diseaseName: '病毒性肝炎', diseaseCode: 'B18.1', diseaseCategory: '乙类',
        reportType: '初次报告', infectionSource: '不明确',
        clinicalDiagnosis: '慢性乙型病毒性肝炎（活动期）', labResult: 'HBsAg阳性，HBeAg阳性，HBV-DNA 5.6×10^5 IU/mL',
        severity: '普通', outcome: '好转', outcomeDate: null,
        isolationType: '无需隔离', isolationDate: null,
        reporter: lsUser.name, reviewer: gkUser.name, reviewComment: '慢性乙肝活动期，需规范抗病毒治疗',
        status: '已审核', reportToCDC: 1, reportToCDCTime: new Date(2024, 3, 22),
      },
      {
        patientId: 'ID20240006', patientName: '刘军', gender: '男', age: 28,
        idCard: '420102199604056789', phone: '13400123006', address: '武汉市武昌区中山路33号',
        dept: '感染科', bedNo: 'ID-05',
        admissionDate: new Date(2024, 4, 8), onsetDate: new Date(2024, 4, 3),
        diagnosisDate: new Date(2024, 4, 9), reportDate: new Date(2024, 4, 10),
        diseaseName: '麻疹', diseaseCode: 'B05.9', diseaseCategory: '乙类',
        reportType: '初次报告', infectionSource: '社区接触',
        clinicalDiagnosis: '麻疹（典型）', labResult: '麻疹病毒IgM抗体阳性',
        severity: '普通', outcome: '治愈', outcomeDate: new Date(2024, 4, 20),
        isolationType: '住院隔离', isolationDate: new Date(2024, 4, 8),
        reporter: wmUser.name, reviewer: gkUser.name, reviewComment: '成人麻疹，注意密切接触者追踪',
        status: '已上报', reportToCDC: 1, reportToCDCTime: new Date(2024, 4, 10),
      },
      {
        patientId: 'ID20240007', patientName: '杨杰', gender: '男', age: 6,
        idCard: '500102201806071234', phone: '13300123007', address: '重庆市渝中区解放碑步行街12号',
        dept: '儿科', bedNo: 'P-08',
        admissionDate: new Date(2024, 5, 12), onsetDate: new Date(2024, 5, 10),
        diagnosisDate: new Date(2024, 5, 13), reportDate: new Date(2024, 5, 13),
        diseaseName: '流行性感冒', diseaseCode: 'J11.1', diseaseCategory: '丙类',
        reportType: '初次报告', infectionSource: '幼儿园接触',
        clinicalDiagnosis: '流行性感冒（甲型H3N2）', labResult: '甲型流感病毒抗原阳性',
        severity: '轻症', outcome: '治愈', outcomeDate: new Date(2024, 5, 18),
        isolationType: '居家隔离', isolationDate: new Date(2024, 5, 13),
        reporter: wmUser.name, reviewer: gkUser.name, reviewComment: '儿童流感，居家隔离至症状消失后48小时',
        status: '已审核', reportToCDC: 0,
      },
      {
        patientId: 'ID20240008', patientName: '黄敏', gender: '女', age: 4,
        idCard: '350102202003085678', phone: '13200123008', address: '福州市鼓楼区五一广场路45号',
        dept: '儿科', bedNo: 'P-12',
        admissionDate: new Date(2024, 6, 5), onsetDate: new Date(2024, 6, 3),
        diagnosisDate: new Date(2024, 6, 6), reportDate: new Date(2024, 6, 7),
        diseaseName: '手足口病', diseaseCode: 'B08.4', diseaseCategory: '丙类',
        reportType: '初次报告', infectionSource: '托幼机构接触',
        clinicalDiagnosis: '手足口病（普通型）', labResult: '肠道病毒CoxA16核酸阳性',
        severity: '轻症', outcome: '治愈', outcomeDate: new Date(2024, 6, 13),
        isolationType: '居家隔离', isolationDate: new Date(2024, 6, 6),
        reporter: wmUser.name, reviewer: gkUser.name, reviewComment: '轻症手足口病，居家隔离观察',
        status: '已审核', reportToCDC: 0,
      },
      {
        patientId: 'ID20240009', patientName: '周文', gender: '男', age: 11,
        idCard: '210102201305098901', phone: '13100123009', address: '沈阳市和平区太原街22号',
        dept: '儿科', bedNo: 'P-15',
        admissionDate: new Date(2024, 7, 18), onsetDate: new Date(2024, 7, 15),
        diagnosisDate: new Date(2024, 7, 19), reportDate: new Date(2024, 7, 19),
        diseaseName: '流行性腮腺炎', diseaseCode: 'B26.9', diseaseCategory: '丙类',
        reportType: '初次报告', infectionSource: '学校接触',
        clinicalDiagnosis: '流行性腮腺炎', labResult: '腮腺炎病毒IgM抗体阳性',
        severity: '普通', outcome: '治愈', outcomeDate: new Date(2024, 8, 2),
        isolationType: '居家隔离', isolationDate: new Date(2024, 7, 19),
        reporter: lsUser.name, reviewer: gkUser.name, reviewComment: '学校聚集性腮腺炎，注意同班级排查',
        status: '已审核', reportToCDC: 0,
      },
      {
        patientId: 'ID20240010', patientName: '吴芳', gender: '女', age: 7,
        idCard: '120102201704061234', phone: '13000123010', address: '天津市和平区南京路66号',
        dept: '儿科', bedNo: 'P-18',
        admissionDate: new Date(2024, 8, 22), onsetDate: new Date(2024, 8, 20),
        diagnosisDate: new Date(2024, 8, 23), reportDate: new Date(2024, 8, 24),
        diseaseName: '水痘', diseaseCode: 'B01.9', diseaseCategory: '丙类',
        reportType: '初次报告', infectionSource: '同学传染',
        clinicalDiagnosis: '水痘', labResult: 'VZV-IgM抗体阳性',
        severity: '轻症', outcome: '治愈', outcomeDate: new Date(2024, 9, 5),
        isolationType: '居家隔离', isolationDate: new Date(2024, 8, 23),
        reporter: wmUser.name, reviewer: gkUser.name,
        status: '已审核', reportToCDC: 0,
      },
      {
        patientId: 'ID20240011', patientName: '孙强', gender: '男', age: 55,
        idCard: '610102196910115678', phone: '15900123011', address: '西安市碑林区南大街88号',
        dept: '感染科', bedNo: 'ID-06',
        admissionDate: new Date(2024, 9, 5), onsetDate: new Date(2024, 9, 1),
        diagnosisDate: new Date(2024, 9, 7), reportDate: new Date(2024, 9, 7),
        diseaseName: '新型冠状病毒感染', diseaseCode: 'U07.1', diseaseCategory: '乙类',
        reportType: '订正报告', infectionSource: '社区获得性',
        clinicalDiagnosis: '新型冠状病毒感染（重型）', labResult: '核酸阳性，Ct值18.7，胸部CT示双肺多发磨玻璃影',
        severity: '重症', outcome: '好转', outcomeDate: null,
        isolationType: '住院隔离', isolationDate: new Date(2024, 9, 5),
        reporter: lsUser.name, reviewer: gkUser.name, reviewComment: '重型新冠，有基础疾病（糖尿病），转入ICU',
        status: '已审核', reportToCDC: 1, reportToCDCTime: new Date(2024, 9, 7),
      },
      {
        patientId: 'ID20240012', patientName: '郑华', gender: '男', age: 38,
        idCard: '430102198604088901', phone: '15800123012', address: '长沙市芙蓉区五一大道128号',
        dept: '感染科', bedNo: 'ID-07',
        admissionDate: new Date(2024, 10, 10), onsetDate: new Date(2024, 10, 6),
        diagnosisDate: new Date(2024, 10, 12), reportDate: new Date(2024, 10, 12),
        diseaseName: '病毒性肝炎', diseaseCode: 'B17.1', diseaseCategory: '乙类',
        reportType: '初次报告', infectionSource: '饮食不洁',
        clinicalDiagnosis: '急性戊型病毒性肝炎', labResult: 'HEV-IgM阳性，ALT 856 U/L，TBil 128 μmol/L',
        severity: '普通', outcome: '好转', outcomeDate: null,
        isolationType: '住院隔离', isolationDate: new Date(2024, 10, 10),
        reporter: lsUser.name, reviewer: null, reviewComment: null,
        status: '待审核', reportToCDC: 0,
      },
      {
        patientId: 'ID20240013', patientName: '马秀英', gender: '女', age: 65,
        idCard: '220102195812021234', phone: '15700123013', address: '长春市朝阳区红旗街56号',
        dept: '呼吸科', bedNo: 'R-22',
        admissionDate: new Date(2024, 10, 25), onsetDate: new Date(2024, 10, 20),
        diagnosisDate: new Date(2024, 10, 27), reportDate: new Date(2024, 10, 27),
        diseaseName: '肺结核', diseaseCode: 'A15.3', diseaseCategory: '乙类',
        reportType: '初次报告', infectionSource: '不明确',
        clinicalDiagnosis: '血行播散性肺结核', labResult: '痰涂片抗酸杆菌阳性（+），胸部CT示双肺粟粒样结节',
        severity: '重症', outcome: null, outcomeDate: null,
        isolationType: '住院隔离', isolationDate: new Date(2024, 10, 27),
        reporter: lsUser.name, reviewer: null, reviewComment: null,
        status: '待审核', reportToCDC: 0,
      },
      {
        patientId: 'ID20240014', patientName: '冯伟', gender: '男', age: 3,
        idCard: '340102202104075678', phone: '15600123014', address: '合肥市蜀山区长江西路78号',
        dept: '儿科', bedNo: 'P-20',
        admissionDate: new Date(2024, 11, 2), onsetDate: new Date(2024, 10, 30),
        diagnosisDate: new Date(2024, 11, 3), reportDate: new Date(2024, 11, 3),
        diseaseName: '手足口病', diseaseCode: 'B08.4', diseaseCategory: '丙类',
        reportType: '初次报告', infectionSource: '托幼机构接触',
        clinicalDiagnosis: '手足口病（重症）', labResult: 'EV71核酸阳性',
        severity: '重症', outcome: '好转', outcomeDate: null,
        isolationType: '住院隔离', isolationDate: new Date(2024, 11, 3),
        reporter: wmUser.name, reviewer: null, reviewComment: null,
        status: '待审核', reportToCDC: 0,
      },
      {
        patientId: 'ID20240015', patientName: '韩敏', gender: '女', age: 30,
        idCard: '130102199406098901', phone: '15500123015', address: '石家庄市长安区中山东路166号',
        dept: '感染科', bedNo: 'ID-08',
        admissionDate: new Date(2024, 11, 15), onsetDate: new Date(2024, 11, 12),
        diagnosisDate: new Date(2024, 11, 16), reportDate: new Date(2024, 11, 17),
        diseaseName: '流行性感冒', diseaseCode: 'J11.1', diseaseCategory: '丙类',
        reportType: '初次报告', infectionSource: '社区获得性',
        clinicalDiagnosis: '流行性感冒（甲型H1N1）', labResult: '甲型H1N1流感病毒核酸阳性',
        severity: '普通', outcome: null, outcomeDate: null,
        isolationType: '居家隔离', isolationDate: new Date(2024, 11, 16),
        reporter: lsUser.name, reviewer: null, reviewComment: null,
        status: '待审核', reportToCDC: 0,
      },
    ];
    const createdIdCases = await db.infectiousDiseaseCase.createMany({ data: idCaseData });

    // Get created infectious disease cases for linking contact tracings
    const allIdCases = await db.infectiousDiseaseCase.findMany();

    // ContactTracing (20 records) linked to some cases
    const contactTracingData = [
      // Contacts for case 0: 霍乱 - 王建国
      {
        caseId: allIdCases[0].id, casePatientName: '王建国',
        contactName: '王丽', contactIdCard: '110101198205061234', contactPhone: '13800123051', contactAddress: '北京市朝阳区建国路88号',
        gender: '女', age: 42, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 0, 14), contactDuration: '24小时', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '有症状', symptomDetail: '轻微腹泻2次',
        quarantineType: '集中隔离', quarantineStart: new Date(2024, 0, 16), quarantineEnd: new Date(2024, 0, 23),
        testResult: '阴性', testDate: new Date(2024, 0, 17),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 0, 23),
        remark: '患者妻子，同餐饮食', status: '已确认',
      },
      {
        caseId: allIdCases[0].id, casePatientName: '王建国',
        contactName: '李明', contactIdCard: '110101198003075678', contactPhone: '13800123052', contactAddress: '北京市朝阳区建国路90号',
        gender: '男', age: 44, relationship: '同事', contactType: '一般接触',
        contactDate: new Date(2024, 0, 13), contactDuration: '4小时', contactLocation: '单位食堂',
        exposureLevel: '低', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 0, 16), quarantineEnd: new Date(2024, 0, 23),
        testResult: '阴性', testDate: new Date(2024, 0, 18),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 0, 23),
        remark: '同单位午餐共餐', status: '已确认',
      },
      // Contacts for case 1: 鼠疫 - 李秀英
      {
        caseId: allIdCases[1].id, casePatientName: '李秀英',
        contactName: '张军', contactIdCard: '320102198504098901', contactPhone: '13900123053', contactAddress: '南京市鼓楼区中山路15号',
        gender: '男', age: 39, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 1, 2), contactDuration: '48小时', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '集中隔离', quarantineStart: new Date(2024, 1, 4), quarantineEnd: new Date(2024, 1, 18),
        testResult: '阴性', testDate: new Date(2024, 1, 5),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 1, 18),
        remark: '患者丈夫，同住密切接触', status: '已确认',
      },
      {
        caseId: allIdCases[1].id, casePatientName: '李秀英',
        contactName: '刘芳', contactIdCard: '320102199101031234', contactPhone: '13900123054', contactAddress: '南京市鼓楼区中山路20号',
        gender: '女', age: 33, relationship: '医护', contactType: '密切接触',
        contactDate: new Date(2024, 1, 3), contactDuration: '8小时', contactLocation: '医院急诊科',
        exposureLevel: '高', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '集中隔离', quarantineStart: new Date(2024, 1, 4), quarantineEnd: new Date(2024, 1, 18),
        testResult: '阴性', testDate: new Date(2024, 1, 6),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 1, 18),
        remark: '接诊护士，有防护但需医学观察', status: '已确认',
      },
      // Contacts for case 2: 新型冠状病毒感染 - 张明华
      {
        caseId: allIdCases[2].id, casePatientName: '张明华',
        contactName: '张小红', contactIdCard: '440103199208115678', contactPhone: '13700123055', contactAddress: '广州市越秀区人民路58号',
        gender: '女', age: 32, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 2, 8), contactDuration: '72小时', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '已确诊', symptomDetail: '核酸阳性，无症状感染',
        quarantineType: '集中隔离', quarantineStart: new Date(2024, 2, 12), quarantineEnd: new Date(2024, 2, 26),
        testResult: '阳性', testDate: new Date(2024, 2, 13),
        followUpStatus: '已转确诊', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 2, 26),
        remark: '患者女儿，无症状感染者，已转确诊管理', status: '已确认',
      },
      {
        caseId: allIdCases[2].id, casePatientName: '张明华',
        contactName: '王大力', contactIdCard: '440103198507128901', contactPhone: '13700123056', contactAddress: '广州市天河区天河路100号',
        gender: '男', age: 39, relationship: '同事', contactType: '密切接触',
        contactDate: new Date(2024, 2, 9), contactDuration: '8小时', contactLocation: '办公室',
        exposureLevel: '中', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '居家隔离', quarantineStart: new Date(2024, 2, 12), quarantineEnd: new Date(2024, 2, 26),
        testResult: '阴性', testDate: new Date(2024, 2, 14),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 2, 26),
        remark: '同办公室密切接触者', status: '已确认',
      },
      // Contacts for case 3: 肺结核 - 陈伟强
      {
        caseId: allIdCases[3].id, casePatientName: '陈伟强',
        contactName: '陈小明', contactIdCard: '510104200506131234', contactPhone: '13600123057', contactAddress: '成都市锦江区春熙路99号',
        gender: '男', age: 19, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 3, 1), contactDuration: '长期', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '有症状', symptomDetail: '咳嗽2周，午后低热',
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 3, 6), quarantineEnd: null,
        testResult: '阳性', testDate: new Date(2024, 3, 8),
        followUpStatus: '随访中', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 4, 6),
        remark: '患者儿子，PPD强阳性，预防性服药中', status: '已确认',
      },
      {
        caseId: allIdCases[3].id, casePatientName: '陈伟强',
        contactName: '周丽', contactIdCard: '510104198809155678', contactPhone: '13600123058', contactAddress: '成都市锦江区春熙路99号',
        gender: '女', age: 36, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 3, 1), contactDuration: '长期', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 3, 6), quarantineEnd: null,
        testResult: '阴性', testDate: new Date(2024, 3, 8),
        followUpStatus: '随访中', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 5, 6),
        remark: '患者妻子，PPD一般阳性，定期复查', status: '已确认',
      },
      // Contacts for case 5: 麻疹 - 刘军
      {
        caseId: allIdCases[5].id, casePatientName: '刘军',
        contactName: '赵敏', contactIdCard: '420102199505168901', contactPhone: '13400123059', contactAddress: '武汉市武昌区中山路35号',
        gender: '女', age: 29, relationship: '同事', contactType: '密切接触',
        contactDate: new Date(2024, 4, 5), contactDuration: '8小时', contactLocation: '办公室',
        exposureLevel: '中', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 4, 9), quarantineEnd: new Date(2024, 4, 23),
        testResult: '阴性', testDate: new Date(2024, 4, 11),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 4, 23),
        remark: '同事，有麻疹疫苗接种史', status: '已确认',
      },
      {
        caseId: allIdCases[5].id, casePatientName: '刘军',
        contactName: '刘小宝', contactIdCard: '420102202006171234', contactPhone: '13400123060', contactAddress: '武汉市武昌区中山路33号',
        gender: '男', age: 4, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 4, 3), contactDuration: '48小时', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '已确诊', symptomDetail: '发热、皮疹，麻疹IgM阳性',
        quarantineType: '住院隔离', quarantineStart: new Date(2024, 4, 9), quarantineEnd: new Date(2024, 4, 23),
        testResult: '阳性', testDate: new Date(2024, 4, 10),
        followUpStatus: '已转确诊', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 4, 23),
        remark: '患者儿子，未完成麻疹疫苗免疫程序', status: '已确认',
      },
      // Contacts for case 10: 新冠重型 - 孙强
      {
        caseId: allIdCases[10].id, casePatientName: '孙强',
        contactName: '孙丽', contactIdCard: '610102199208195678', contactPhone: '15900123061', contactAddress: '西安市碑林区南大街90号',
        gender: '女', age: 32, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 9, 3), contactDuration: '72小时', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '有症状', symptomDetail: '咽痛、低热1天',
        quarantineType: '集中隔离', quarantineStart: new Date(2024, 9, 7), quarantineEnd: null,
        testResult: '阳性', testDate: new Date(2024, 9, 8),
        followUpStatus: '随访中', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 9, 21),
        remark: '患者女儿，轻型新冠', status: '已确认',
      },
      {
        caseId: allIdCases[10].id, casePatientName: '孙强',
        contactName: '钱文', contactIdCard: '610102198710218901', contactPhone: '15900123062', contactAddress: '西安市新城区西一路22号',
        gender: '男', age: 37, relationship: '同事', contactType: '一般接触',
        contactDate: new Date(2024, 9, 4), contactDuration: '2小时', contactLocation: '会议室',
        exposureLevel: '低', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 9, 7), quarantineEnd: new Date(2024, 9, 21),
        testResult: '阴性', testDate: new Date(2024, 9, 9),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 9, 21),
        remark: '会议接触，佩戴口罩', status: '已确认',
      },
      {
        caseId: allIdCases[10].id, casePatientName: '孙强',
        contactName: '李建华', contactIdCard: '610102199005221234', contactPhone: '15900123063', contactAddress: '西安市雁塔区小寨路56号',
        gender: '男', age: 34, relationship: '其他', contactType: '一般接触',
        contactDate: new Date(2024, 9, 5), contactDuration: '30分钟', contactLocation: '超市',
        exposureLevel: '低', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 9, 7), quarantineEnd: new Date(2024, 9, 21),
        testResult: '阴性', testDate: new Date(2024, 9, 10),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 9, 21),
        remark: '同小区偶遇，短暂接触', status: '已排除',
      },
      // More contacts for case 7: 手足口病 - 黄敏
      {
        caseId: allIdCases[7].id, casePatientName: '黄敏',
        contactName: '黄伟', contactIdCard: '350102198606245678', contactPhone: '13200123064', contactAddress: '福州市鼓楼区五一广场路45号',
        gender: '男', age: 38, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 6, 4), contactDuration: '24小时', contactLocation: '家中',
        exposureLevel: '中', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 6, 6), quarantineEnd: new Date(2024, 6, 20),
        testResult: '阴性', testDate: new Date(2024, 6, 8),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 6, 20),
        remark: '患者父亲', status: '已确认',
      },
      // Contacts for case 8: 流行性腮腺炎 - 周文
      {
        caseId: allIdCases[8].id, casePatientName: '周文',
        contactName: '周华', contactIdCard: '210102199408258901', contactPhone: '13100123065', contactAddress: '沈阳市和平区太原街25号',
        gender: '女', age: 30, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 7, 16), contactDuration: '48小时', contactLocation: '家中',
        exposureLevel: '高', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 7, 19), quarantineEnd: new Date(2024, 8, 2),
        testResult: '阴性', testDate: new Date(2024, 7, 21),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 8, 2),
        remark: '患者母亲，有腮腺炎病史', status: '已确认',
      },
      {
        caseId: allIdCases[8].id, casePatientName: '周文',
        contactName: '吴强', contactIdCard: '210102201305091234', contactPhone: '13100123066', contactAddress: '沈阳市沈河区青年大街12号',
        gender: '男', age: 11, relationship: '其他', contactType: '密切接触',
        contactDate: new Date(2024, 7, 14), contactDuration: '6小时', contactLocation: '学校教室',
        exposureLevel: '高', symptomStatus: '已确诊', symptomDetail: '双侧腮腺肿大，腮腺炎IgM阳性',
        quarantineType: '居家隔离', quarantineStart: new Date(2024, 7, 19), quarantineEnd: null,
        testResult: '阳性', testDate: new Date(2024, 7, 20),
        followUpStatus: '已转确诊', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 8, 2),
        remark: '同班同学，班级聚集性疫情', status: '已确认',
      },
      {
        caseId: allIdCases[8].id, casePatientName: '周文',
        contactName: '林芳', contactIdCard: '210102201206185678', contactPhone: '13100123067', contactAddress: '沈阳市和平区北四马路8号',
        gender: '女', age: 12, relationship: '其他', contactType: '一般接触',
        contactDate: new Date(2024, 7, 15), contactDuration: '1小时', contactLocation: '学校走廊',
        exposureLevel: '低', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 7, 19), quarantineEnd: new Date(2024, 8, 2),
        testResult: '阴性', testDate: new Date(2024, 7, 22),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 8, 2),
        remark: '隔壁班学生', status: '已确认',
      },
      // Contacts for case 4: 病毒性肝炎 - 赵丽芳
      {
        caseId: allIdCases[4].id, casePatientName: '赵丽芳',
        contactName: '赵刚', contactIdCard: '330102198504068901', contactPhone: '13500123068', contactAddress: '杭州市上城区解放路80号',
        gender: '男', age: 39, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 3, 15), contactDuration: '长期', contactLocation: '家中',
        exposureLevel: '中', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 3, 22), quarantineEnd: null,
        testResult: '阴性', testDate: new Date(2024, 3, 24),
        followUpStatus: '随访中', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 5, 22),
        remark: '患者丈夫，乙肝两对半全阴性，建议接种乙肝疫苗', status: '已确认',
      },
      // Contacts for case 9: 水痘 - 吴芳
      {
        caseId: allIdCases[9].id, casePatientName: '吴芳',
        contactName: '吴建国', contactIdCard: '120102198307071234', contactPhone: '13000123069', contactAddress: '天津市和平区南京路68号',
        gender: '男', age: 41, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 8, 21), contactDuration: '24小时', contactLocation: '家中',
        exposureLevel: '中', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 8, 23), quarantineEnd: new Date(2024, 9, 7),
        testResult: '阴性', testDate: new Date(2024, 8, 25),
        followUpStatus: '已解除', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 9, 7),
        remark: '患者父亲，有水痘病史', status: '已确认',
      },
      // Contact for case 11: 病毒性肝炎 - 郑华
      {
        caseId: allIdCases[11].id, casePatientName: '郑华',
        contactName: '郑小明', contactIdCard: '430102199507081234', contactPhone: '15800123070', contactAddress: '长沙市芙蓉区五一大道130号',
        gender: '男', age: 29, relationship: '家属', contactType: '密切接触',
        contactDate: new Date(2024, 10, 8), contactDuration: '长期', contactLocation: '家中',
        exposureLevel: '中', symptomStatus: '无症状', symptomDetail: null,
        quarantineType: '自我健康监测', quarantineStart: new Date(2024, 10, 12), quarantineEnd: null,
        testResult: '阴性', testDate: new Date(2024, 10, 14),
        followUpStatus: '随访中', followUpPerson: gkUser.name, lastFollowUpDate: new Date(2024, 11, 12),
        remark: '患者弟弟，建议检查肝功能及肝炎病毒标志物', status: '已确认',
      },
    ];
    await db.contactTracing.createMany({ data: contactTracingData });

    // SymptomSurveillance (12 records)
    const symptomSurveillanceData = [
      {
        dept: '感染科', patientId: 'OUT20240001', patientName: '田小明', gender: '男', age: 25,
        temperature: 38.5, symptomGroup: '发热', symptomDetail: '发热3天，伴头痛、全身酸痛',
        onsetDate: new Date(2024, 0, 10), reportDate: new Date(2024, 0, 13),
        reporter: lsUser.name, isClustered: 0, alertTriggered: 0,
        preliminaryJudge: '上呼吸道感染', handlingMeasure: '对症治疗，建议居家休息',
        status: '已核实',
      },
      {
        dept: '儿科', patientId: 'OUT20240002', patientName: '刘小红', gender: '女', age: 5,
        temperature: 39.2, symptomGroup: '发热', symptomDetail: '高热2天，伴皮疹、口腔溃疡',
        onsetDate: new Date(2024, 1, 5), reportDate: new Date(2024, 1, 7),
        reporter: wmUser.name, isClustered: 1, clusterId: 'CL2024001', alertTriggered: 1, alertId: null,
        preliminaryJudge: '手足口病聚集性疫情', handlingMeasure: '建议居家隔离，托幼机构停课1周',
        status: '已预警',
      },
      {
        dept: '内科', patientId: 'OUT20240003', patientName: '张伟', gender: '男', age: 55,
        temperature: 38.0, symptomGroup: '腹泻', symptomDetail: '腹泻5次/天，水样便3天，伴腹痛',
        onsetDate: new Date(2024, 2, 18), reportDate: new Date(2024, 2, 20),
        reporter: lsUser.name, isClustered: 0, alertTriggered: 0,
        preliminaryJudge: '急性胃肠炎', handlingMeasure: '补液、止泻治疗，注意饮食卫生',
        status: '已核实',
      },
      {
        dept: '感染科', patientId: 'OUT20240004', patientName: '陈秀兰', gender: '女', age: 48,
        temperature: 37.8, symptomGroup: '皮疹', symptomDetail: '全身皮疹3天，伴瘙痒、低热',
        onsetDate: new Date(2024, 3, 8), reportDate: new Date(2024, 3, 10),
        reporter: lsUser.name, isClustered: 0, alertTriggered: 0,
        preliminaryJudge: '水痘', handlingMeasure: '隔离治疗，避免接触孕妇及儿童',
        status: '已核实',
      },
      {
        dept: '呼吸科', patientId: 'OUT20240005', patientName: '李强', gender: '男', age: 62,
        temperature: 38.8, symptomGroup: '呼吸道', symptomDetail: '咳嗽、咳痰2周，伴午后低热、盗汗',
        onsetDate: new Date(2024, 4, 1), reportDate: new Date(2024, 4, 15),
        reporter: lsUser.name, isClustered: 0, alertTriggered: 1, alertId: null,
        preliminaryJudge: '肺结核疑似', handlingMeasure: '转感染科进一步检查，痰涂片及GeneXpert',
        status: '已预警',
      },
      {
        dept: '急诊科', patientId: 'OUT20240006', patientName: '王大勇', gender: '男', age: 35,
        temperature: 40.1, symptomGroup: '发热', symptomDetail: '高热3天，伴寒战、剧烈头痛、肌肉酸痛',
        onsetDate: new Date(2024, 5, 20), reportDate: new Date(2024, 5, 22),
        reporter: wmUser.name, isClustered: 0, alertTriggered: 0,
        preliminaryJudge: '流行性感冒', handlingMeasure: '奥司他韦抗病毒治疗，居家隔离',
        status: '已核实',
      },
      {
        dept: '儿科', patientId: 'OUT20240007', patientName: '赵宝宝', gender: '男', age: 2,
        temperature: 39.5, symptomGroup: '发热', symptomDetail: '发热伴惊厥1次，前囟隆起',
        onsetDate: new Date(2024, 6, 12), reportDate: new Date(2024, 6, 12),
        reporter: wmUser.name, isClustered: 0, alertTriggered: 1, alertId: null,
        preliminaryJudge: '中枢神经系统感染', handlingMeasure: '紧急腰椎穿刺，转PICU',
        status: '已预警',
      },
      {
        dept: '内科', patientId: null, patientName: '集体就诊', gender: null, age: null,
        temperature: null, symptomGroup: '腹泻', symptomDetail: '内科病房3天内5名患者出现腹泻症状，水样便2-6次/天',
        onsetDate: new Date(2024, 7, 5), reportDate: new Date(2024, 7, 8),
        reporter: gkUser.name, isClustered: 1, clusterId: 'CL2024002', alertTriggered: 1, alertId: null,
        preliminaryJudge: '院内感染性腹泻聚集', handlingMeasure: '开展流行病学调查，加强手卫生，环境消毒',
        status: '已预警',
      },
      {
        dept: '感染科', patientId: 'OUT20240009', patientName: '周丽华', gender: '女', age: 40,
        temperature: 37.5, symptomGroup: '皮疹', symptomDetail: '面部蝶形红斑1周，伴关节痛、口腔溃疡',
        onsetDate: new Date(2024, 8, 3), reportDate: new Date(2024, 8, 10),
        reporter: lsUser.name, isClustered: 0, alertTriggered: 0,
        preliminaryJudge: '系统性红斑狼疮', handlingMeasure: '自身免疫相关检查，转风湿免疫科',
        status: '排除',
      },
      {
        dept: 'ICU', patientId: 'IN20240001', patientName: '钱大伟', gender: '男', age: 70,
        temperature: 38.3, symptomGroup: '呼吸道', symptomDetail: '气管插管患者，新发肺部浸润影，脓性痰增多',
        onsetDate: new Date(2024, 9, 15), reportDate: new Date(2024, 9, 16),
        reporter: wmUser.name, isClustered: 0, alertTriggered: 0,
        preliminaryJudge: '呼吸机相关肺炎', handlingMeasure: '痰培养，调整抗菌方案，评估撤机',
        status: '已核实',
      },
      {
        dept: '儿科', patientId: 'OUT20240011', patientName: '孙小明', gender: '男', age: 8,
        temperature: 38.6, symptomGroup: '发热', symptomDetail: '发热伴耳后淋巴结肿大，腮腺区肿痛',
        onsetDate: new Date(2024, 10, 8), reportDate: new Date(2024, 10, 10),
        reporter: wmUser.name, isClustered: 1, clusterId: 'CL2024003', alertTriggered: 1, alertId: null,
        preliminaryJudge: '流行性腮腺炎聚集', handlingMeasure: '居家隔离至腮腺消肿后5天，班级密切观察',
        status: '已预警',
      },
      {
        dept: '急诊科', patientId: 'OUT20240012', patientName: '冯建华', gender: '男', age: 45,
        temperature: 39.0, symptomGroup: '出血热', symptomDetail: '发热5天，伴头痛、腰痛、少尿，皮肤出血点',
        onsetDate: new Date(2024, 11, 1), reportDate: new Date(2024, 11, 5),
        reporter: lsUser.name, isClustered: 0, alertTriggered: 1, alertId: null,
        preliminaryJudge: '肾综合征出血热疑似', handlingMeasure: '查汉坦病毒抗体，隔离治疗，监测肾功能',
        status: '待核实',
      },
    ];
    await db.symptomSurveillance.createMany({ data: symptomSurveillanceData });

    // DiseaseAlert (8 records)
    const diseaseAlertData = [
      {
        alertType: '法定传染病预警', alertLevel: '红色', diseaseName: '霍乱',
        alertSource: '病例上报', triggerRule: '甲类传染病2小时内必须上报CDC',
        relatedCaseIds: allIdCases[0]?.id || null, relatedSymptomIds: null,
        affectedDept: '感染科', affectedCount: 1,
        description: '发现甲类传染病霍乱确诊病例，需立即启动应急响应',
        suggestion: '1.2小时内网络直报CDC；2.严格隔离管理患者；3.追踪全部密切接触者；4.开展流行病学调查',
        handler: gkUser.name, handleResult: '已完成CDC网络直报，追踪密切接触者2人并实施医学观察',
        handleTime: new Date(2024, 0, 16), status: '已处理',
      },
      {
        alertType: '法定传染病预警', alertLevel: '红色', diseaseName: '鼠疫',
        alertSource: '病例上报', triggerRule: '甲类传染病2小时内必须上报CDC',
        relatedCaseIds: allIdCases[1]?.id || null, relatedSymptomIds: null,
        affectedDept: '感染科', affectedCount: 1,
        description: '发现甲类传染病鼠疫疑似病例，需立即启动应急响应',
        suggestion: '1.2小时内网络直报CDC；2.严格隔离管理；3.全面排查接触者；4.病区终末消毒',
        handler: gkUser.name, handleResult: '已上报CDC，患者转入负压病房，接触者2人集中隔离观察',
        handleTime: new Date(2024, 1, 4), status: '已处理',
      },
      {
        alertType: '聚集性疫情预警', alertLevel: '橙色', diseaseName: '手足口病',
        alertSource: '症状监测', triggerRule: '同一托幼机构7天内出现2例及以上手足口病',
        relatedCaseIds: `${allIdCases[7]?.id || ''},${allIdCases[13]?.id || ''}`, relatedSymptomIds: null,
        affectedDept: '儿科', affectedCount: 3,
        description: '某托幼机构7天内出现3例手足口病，达到聚集性疫情预警标准',
        suggestion: '1.建议托幼机构停课1周；2.全面晨午检；3.密切接触者居家观察；4.加强消毒',
        handler: gkUser.name, handleResult: '已通知托幼机构停课5天，开展全面消毒，追踪接触者12人',
        handleTime: new Date(2024, 6, 8), status: '已处理',
      },
      {
        alertType: '症状监测预警', alertLevel: '黄色', diseaseName: null,
        alertSource: '系统自动', triggerRule: '同一病区3天内出现3例及以上相同症状',
        relatedCaseIds: null, relatedSymptomIds: null,
        affectedDept: '内科', affectedCount: 5,
        description: '内科病房3天内5名患者出现腹泻症状，存在院内感染聚集风险',
        suggestion: '1.开展流行病学调查；2.加强手卫生；3.环境采样检测；4.必要时关闭病区',
        handler: gkUser.name, handleResult: '已完成流调，确认为诺如病毒感染，加强手卫生及消毒后无新发病例',
        handleTime: new Date(2024, 7, 10), status: '已处理',
      },
      {
        alertType: '聚集性疫情预警', alertLevel: '黄色', diseaseName: '流行性腮腺炎',
        alertSource: '症状监测', triggerRule: '同一班级1周内出现2例及以上流行性腮腺炎',
        relatedCaseIds: allIdCases[8]?.id || null, relatedSymptomIds: null,
        affectedDept: '儿科', affectedCount: 2,
        description: '某小学同一班级1周内出现2例流行性腮腺炎，需关注聚集性疫情',
        suggestion: '1.加强学校晨检；2.建议密切接触者应急接种；3.隔离患者至消肿后5天',
        handler: null, handleResult: null, handleTime: null, status: '待处理',
      },
      {
        alertType: '输入性传染病预警', alertLevel: '橙色', diseaseName: '新型冠状病毒感染',
        alertSource: '病例上报', triggerRule: '重症新冠病例需重点监控',
        relatedCaseIds: allIdCases[10]?.id || null, relatedSymptomIds: null,
        affectedDept: 'ICU', affectedCount: 1,
        description: 'ICU收治1例重型新型冠状病毒感染患者，有糖尿病基础疾病，需关注院内传播风险',
        suggestion: '1.单间隔离或负压病房；2.医护人员二级防护；3.密切监测密切接触者；4.加强环境消毒',
        handler: gkUser.name, handleResult: '患者已转入负压病房，医护人员规范防护，追踪接触者3人',
        handleTime: new Date(2024, 9, 8), status: '处理中',
      },
      {
        alertType: '法定传染病预警', alertLevel: '黄色', diseaseName: '肺结核',
        alertSource: '系统自动', triggerRule: '耐多药肺结核病例需加强管控',
        relatedCaseIds: `${allIdCases[3]?.id || ''},${allIdCases[12]?.id || ''}`, relatedSymptomIds: null,
        affectedDept: '感染科', affectedCount: 2,
        description: '近期发现2例肺结核病例，其中1例为耐多药肺结核，需加强管控和接触者筛查',
        suggestion: '1.落实隔离措施；2.全面筛查密切接触者；3.耐药结核规范治疗；4.环境通风消毒',
        handler: null, handleResult: null, handleTime: null, status: '处理中',
      },
      {
        alertType: '症状监测预警', alertLevel: '黄色', diseaseName: '肾综合征出血热',
        alertSource: '人工上报', triggerRule: '出血热症状群需及时预警',
        relatedCaseIds: null, relatedSymptomIds: null,
        affectedDept: '急诊科', affectedCount: 1,
        description: '急诊科发现1例发热伴出血点、少尿患者，疑似肾综合征出血热',
        suggestion: '1.隔离治疗；2.查汉坦病毒抗体；3.监测肾功能及出血倾向；4.追查鼠类接触史',
        handler: null, handleResult: null, handleTime: null, status: '待处理',
      },
    ];
    await db.diseaseAlert.createMany({ data: diseaseAlertData });

    // ========== 预警规则配置 - Sample Data ==========
    const warningRuleData = [
      {
        name: 'ICU感染发病率超标预警', code: 'WR_ICU_INF_RATE', category: '感染监测', ruleType: '阈值预警',
        description: 'ICU科室月度感染发病率超过5%时自动触发预警，需关注院感防控措施落实情况',
        conditionType: '大于', conditionField: 'infectionRate', conditionOperator: 'gt', conditionValue: '5',
        timeWindow: 720, warningLevel: '高', warningType: '暴发预警',
        targetDepts: 'ICU', targetSites: null, targetDiseases: null,
        actionType: 'escalate', cooldownMinutes: 1440, priority: 10,
        isSystem: 1, enabled: 1, triggerCount: 3, lastTriggeredAt: new Date(2024, 11, 5),
        createdBy: '系统',
      },
      {
        name: '科室感染发病率预警', code: 'WR_DEPT_INF_RATE', category: '感染监测', ruleType: '阈值预警',
        description: '任意科室月度感染发病率超过3%时触发预警',
        conditionType: '大于', conditionField: 'infectionRate', conditionOperator: 'gt', conditionValue: '3',
        timeWindow: 720, warningLevel: '中', warningType: '聚集预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 1440, priority: 5,
        isSystem: 1, enabled: 1, triggerCount: 12, lastTriggeredAt: new Date(2024, 10, 20),
        createdBy: '系统',
      },
      {
        name: '甲类传染病即时预警', code: 'WR_CLASS_A_ID', category: '传染病管理', ruleType: '时效预警',
        description: '发现甲类传染病（鼠疫、霍乱）或按甲类管理的传染病时，2小时内必须上报，系统自动触发最高级别预警',
        conditionType: '等于', conditionField: 'notifiableDisease', conditionOperator: 'eq', conditionValue: '甲类',
        timeWindow: 2, warningLevel: '高', warningType: '暴发预警',
        targetDepts: null, targetSites: null, targetDiseases: '霍乱,鼠疫',
        actionType: 'escalate', cooldownMinutes: 30, priority: 20,
        isSystem: 1, enabled: 1, triggerCount: 2, lastTriggeredAt: new Date(2024, 1, 4),
        createdBy: '系统',
      },
      {
        name: '乙类传染病24小时上报预警', code: 'WR_CLASS_B_ID', category: '传染病管理', ruleType: '时效预警',
        description: '发现乙类传染病后，24小时内未完成上报则自动触发预警提醒',
        conditionType: '时间超限', conditionField: 'notifiableDisease', conditionOperator: 'timeout', conditionValue: '乙类',
        timeWindow: 24, warningLevel: '中', warningType: '病例预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 60, priority: 15,
        isSystem: 1, enabled: 1, triggerCount: 5, lastTriggeredAt: new Date(2024, 10, 14),
        createdBy: '系统',
      },
      {
        name: '同科室3例聚集性感染预警', code: 'WR_CLUSTER_3', category: '感染监测', ruleType: '聚集预警',
        description: '同一科室7天内出现3例及以上相同部位感染时，触发聚集性预警',
        conditionType: '大于', conditionField: 'caseCount', conditionOperator: 'gte', conditionValue: '3',
        timeWindow: 168, warningLevel: '高', warningType: '聚集预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'escalate', cooldownMinutes: 360, priority: 8,
        isSystem: 1, enabled: 1, triggerCount: 1, lastTriggeredAt: new Date(2024, 8, 15),
        createdBy: '系统',
      },
      {
        name: '多重耐药菌检出预警', code: 'WR_MDRO_DETECT', category: '感染监测', ruleType: '阈值预警',
        description: '检出多重耐药菌（MRSA/CRKP/CRAB等）时自动触发预警，需关注接触隔离措施',
        conditionType: '大于', conditionField: 'mdroCount', conditionOperator: 'gt', conditionValue: '0',
        timeWindow: 24, warningLevel: '中', warningType: '病例预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 120, priority: 6,
        isSystem: 1, enabled: 1, triggerCount: 8, lastTriggeredAt: new Date(2024, 11, 1),
        createdBy: '系统',
      },
      {
        name: '环境菌落超标预警', code: 'WR_ENV_COLONY', category: '环境监测', ruleType: '阈值预警',
        description: '环境卫生监测中菌落数超过标准限值时触发预警',
        conditionType: '大于', conditionField: 'colonyCount', conditionOperator: 'gt', conditionValue: 'standardLimit',
        timeWindow: 24, warningLevel: '中', warningType: '环境预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 120, priority: 4,
        isSystem: 1, enabled: 1, triggerCount: 4, lastTriggeredAt: new Date(2024, 9, 10),
        createdBy: '系统',
      },
      {
        name: '手卫生依从率偏低预警', code: 'WR_HAND_HYGIENE', category: '职业安全', ruleType: '阈值预警',
        description: '科室月度手卫生依从率低于70%时触发预警',
        conditionType: '小于', conditionField: 'handHygieneRate', conditionOperator: 'lt', conditionValue: '70',
        timeWindow: 720, warningLevel: '低', warningType: '职业暴露预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 1440, priority: 2,
        isSystem: 1, enabled: 1, triggerCount: 6, lastTriggeredAt: new Date(2024, 10, 5),
        createdBy: '系统',
      },
      {
        name: '发热症状聚集预警', code: 'WR_FEVER_CLUSTER', category: '症状监测', ruleType: '聚集预警',
        description: '同一科室3天内出现5例及以上发热（体温≥38℃）患者时触发预警',
        conditionType: '大于', conditionField: 'feverCount', conditionOperator: 'gte', conditionValue: '5',
        timeWindow: 72, warningLevel: '高', warningType: '聚集预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'escalate', cooldownMinutes: 240, priority: 9,
        isSystem: 1, enabled: 1, triggerCount: 2, lastTriggeredAt: new Date(2024, 7, 20),
        createdBy: '系统',
      },
      {
        name: '职业暴露频次预警', code: 'WR_EXPOSURE_FREQ', category: '职业安全', ruleType: '趋势预警',
        description: '科室月度职业暴露事件超过3次时触发预警，需加强职业安全培训',
        conditionType: '大于', conditionField: 'exposureCount', conditionOperator: 'gt', conditionValue: '3',
        timeWindow: 720, warningLevel: '中', warningType: '职业暴露预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 1440, priority: 3,
        isSystem: 1, enabled: 1, triggerCount: 1, lastTriggeredAt: new Date(2024, 6, 15),
        createdBy: '系统',
      },
      {
        name: '抗菌药物使用率超标预警', code: 'WR_ABX_USAGE', category: '感染监测', ruleType: '阈值预警',
        description: '科室住院患者抗菌药物使用率超过60%时触发预警（ICU不超过80%）',
        conditionType: '大于', conditionField: 'infectionRate', conditionOperator: 'gt', conditionValue: '60',
        timeWindow: 720, warningLevel: '低', warningType: '病例预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 1440, priority: 1,
        isSystem: 1, enabled: 0, triggerCount: 0, lastTriggeredAt: null,
        createdBy: '系统',
      },
      {
        name: '腹泻症状聚集预警', code: 'WR_DIARRHEA_CLUSTER', category: '症状监测', ruleType: '聚集预警',
        description: '同一科室3天内出现3例及以上腹泻患者时触发预警',
        conditionType: '大于', conditionField: 'diarrheaCount', conditionOperator: 'gte', conditionValue: '3',
        timeWindow: 72, warningLevel: '中', warningType: '聚集预警',
        targetDepts: null, targetSites: null, targetDiseases: null,
        actionType: 'notify', cooldownMinutes: 360, priority: 7,
        isSystem: 1, enabled: 1, triggerCount: 0, lastTriggeredAt: null,
        createdBy: '系统',
      },
    ];
    await db.warningRule.createMany({ data: warningRuleData });

    // ========== MDRO Warning Rules - 5 key bacteria + cluster rule ==========
    const mdroRules = [
      {
        name: '鲍曼不动杆菌(CRAB)检出预警',
        code: 'WR-MDRO-CRAB',
        category: '感染监测',
        ruleType: '阈值预警',
        description: '检出耐碳青霉烯类鲍曼不动杆菌(CRAB)时自动触发预警，重点关注ICU、呼吸科等高危科室',
        conditionType: '包含',
        conditionField: 'mdroDetection',
        conditionOperator: 'contains',
        conditionValue: '鲍曼不动杆菌',
        timeWindow: 24,
        warningLevel: '高',
        warningType: '病例预警',
        targetDepts: 'ICU,呼吸科,神经外科',
        targetSites: '呼吸道,血流',
        targetDiseases: null,
        actionType: 'notify',
        actionConfig: '{"notifyRoles":["infection_control","clinical_doctor"],"notifyMessage":"检出耐碳青霉烯类鲍曼不动杆菌(CRAB)，请立即采取接触隔离措施"}',
        cooldownMinutes: 60,
        priority: 10,
        isSystem: 1,
        enabled: 1,
        triggerCount: 3,
        lastTriggeredAt: new Date('2024-12-15'),
        createdBy: 'system',
      },
      {
        name: '肺炎克雷伯菌(CRKP)检出预警',
        code: 'WR-MDRO-CRKP',
        category: '感染监测',
        ruleType: '阈值预警',
        description: '检出耐碳青霉烯类肺炎克雷伯菌(CRKP)时自动触发预警，需关注血流感染和尿路感染',
        conditionType: '包含',
        conditionField: 'mdroDetection',
        conditionOperator: 'contains',
        conditionValue: '肺炎克雷伯菌',
        timeWindow: 24,
        warningLevel: '高',
        warningType: '病例预警',
        targetDepts: 'ICU,外科,内科',
        targetSites: '血流,泌尿道,呼吸道',
        targetDiseases: null,
        actionType: 'notify',
        actionConfig: '{"notifyRoles":["infection_control"],"notifyMessage":"检出耐碳青霉烯类肺炎克雷伯菌(CRKP)，请立即采取接触隔离措施"}',
        cooldownMinutes: 60,
        priority: 10,
        isSystem: 1,
        enabled: 1,
        triggerCount: 2,
        lastTriggeredAt: new Date('2024-12-10'),
        createdBy: 'system',
      },
      {
        name: '金黄色葡萄球菌(MRSA)检出预警',
        code: 'WR-MDRO-MRSA',
        category: '感染监测',
        ruleType: '阈值预警',
        description: '检出耐甲氧西林金黄色葡萄球菌(MRSA)时自动触发预警，需加强接触隔离和手卫生',
        conditionType: '包含',
        conditionField: 'mdroDetection',
        conditionOperator: 'contains',
        conditionValue: '金黄色葡萄球菌',
        timeWindow: 24,
        warningLevel: '中',
        warningType: '病例预警',
        targetDepts: 'ICU,外科,骨科',
        targetSites: '手术部位,呼吸道,血流',
        targetDiseases: null,
        actionType: 'notify',
        actionConfig: '{"notifyRoles":["infection_control","clinical_doctor"],"notifyMessage":"检出耐甲氧西林金黄色葡萄球菌(MRSA)，请加强接触隔离和手卫生管理"}',
        cooldownMinutes: 60,
        priority: 8,
        isSystem: 1,
        enabled: 1,
        triggerCount: 5,
        lastTriggeredAt: new Date('2024-12-12'),
        createdBy: 'system',
      },
      {
        name: '屎肠球菌(VRE)检出预警',
        code: 'WR-MDRO-VRE',
        category: '感染监测',
        ruleType: '阈值预警',
        description: '检出耐万古霉素屎肠球菌(VRE)时自动触发预警，需严格执行接触隔离措施',
        conditionType: '包含',
        conditionField: 'mdroDetection',
        conditionOperator: 'contains',
        conditionValue: '屎肠球菌',
        timeWindow: 24,
        warningLevel: '高',
        warningType: '病例预警',
        targetDepts: 'ICU,血液科,肿瘤科',
        targetSites: '血流,泌尿道',
        targetDiseases: null,
        actionType: 'escalate',
        actionConfig: '{"notifyRoles":["infection_control","department_head"],"notifyMessage":"检出耐万古霉素屎肠球菌(VRE)，需严格执行接触隔离，立即上报科主任"}',
        cooldownMinutes: 30,
        priority: 12,
        isSystem: 1,
        enabled: 1,
        triggerCount: 1,
        lastTriggeredAt: new Date('2024-11-20'),
        createdBy: 'system',
      },
      {
        name: '铜绿假单胞菌(CRPA)检出预警',
        code: 'WR-MDRO-CRPA',
        category: '感染监测',
        ruleType: '阈值预警',
        description: '检出耐碳青霉烯类铜绿假单胞菌(CRPA)时自动触发预警，重点关注呼吸机和导管相关感染',
        conditionType: '包含',
        conditionField: 'mdroDetection',
        conditionOperator: 'contains',
        conditionValue: '铜绿假单胞菌',
        timeWindow: 24,
        warningLevel: '中',
        warningType: '病例预警',
        targetDepts: 'ICU,呼吸科,烧伤科',
        targetSites: '呼吸道,泌尿道,手术部位',
        targetDiseases: null,
        actionType: 'notify',
        actionConfig: '{"notifyRoles":["infection_control"],"notifyMessage":"检出耐碳青霉烯类铜绿假单胞菌(CRPA)，请关注呼吸机和导管相关感染防控"}',
        cooldownMinutes: 60,
        priority: 8,
        isSystem: 1,
        enabled: 1,
        triggerCount: 4,
        lastTriggeredAt: new Date('2024-12-14'),
        createdBy: 'system',
      },
      {
        name: '多重耐药菌聚集预警',
        code: 'WR-MDRO-CLUSTER',
        category: '感染监测',
        ruleType: '聚集预警',
        description: '同一科室7天内检出3例及以上同种多重耐药菌时触发聚集预警，提示可能存在院内传播',
        conditionType: '大于等于',
        conditionField: 'mdroCount',
        conditionOperator: 'gte',
        conditionValue: '3',
        timeWindow: 168,
        warningLevel: '高',
        warningType: '聚集预警',
        targetDepts: null,
        targetSites: null,
        targetDiseases: null,
        actionType: 'escalate',
        actionConfig: '{"notifyRoles":["infection_control","department_head","hospital_admin"],"notifyMessage":"同一科室7天内检出3例及以上同种MDRO，存在院内传播风险，请立即启动应急处置"}',
        cooldownMinutes: 360,
        priority: 15,
        isSystem: 1,
        enabled: 1,
        triggerCount: 1,
        lastTriggeredAt: new Date('2024-11-28'),
        createdBy: 'system',
      },
    ];
    await db.warningRule.createMany({ data: mdroRules });

    // ========== MicroLabResult Sample Data ==========
    const microLabData = [
      { patientId: 'ML20240001', patientName: '赵明一', dept: 'ICU', bedNo: 'ICU-01', specimenType: '痰液', specimenNo: 'SP20240001', reportItemName: '鲍曼不动杆菌[CRAB]', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 1, mdroType: 'CRAB', organismName: '耐碳青霉烯类鲍曼不动杆菌', reportTime: new Date(2024, 6, 15, 10, 30), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 1, status: '已审核' },
      { patientId: 'ML20240002', patientName: '钱华二', dept: 'ICU', bedNo: 'ICU-03', specimenType: '血液', specimenNo: 'SP20240002', reportItemName: '肺炎克雷伯菌[CRKP]', resultValue: '阳性', referenceRange: '阴性', isAbnormal: 1, isMDRO: 1, mdroType: 'CRKP', organismName: '耐碳青霉烯类肺炎克雷伯菌', reportTime: new Date(2024, 6, 16, 14, 20), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 1, status: '已审核' },
      { patientId: 'ML20240003', patientName: '孙强三', dept: '外科', bedNo: 'WK-05', specimenType: '分泌物', specimenNo: 'SP20240003', reportItemName: '金黄色葡萄球菌[MRSA]', resultValue: '阳性', referenceRange: '阴性', isAbnormal: 1, isMDRO: 1, mdroType: 'MRSA', organismName: '耐甲氧西林金黄色葡萄球菌', reportTime: new Date(2024, 6, 17, 9, 15), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML20240004', patientName: '李丽四', dept: '内科', bedNo: 'NK-12', specimenType: '尿液', specimenNo: 'SP20240004', reportItemName: '屎肠球菌[VRE]', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 1, mdroType: 'VRE', organismName: '耐万古霉素屎肠球菌', reportTime: new Date(2024, 6, 18, 11, 45), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML20240005', patientName: '周伟五', dept: 'ICU', bedNo: 'ICU-07', specimenType: '痰液', specimenNo: 'SP20240005', reportItemName: '铜绿假单胞菌[CRPA]', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 1, mdroType: 'CRPA', organismName: '耐碳青霉烯类铜绿假单胞菌', reportTime: new Date(2024, 6, 19, 16, 0), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML20240006', patientName: '吴芳六', dept: '儿科', bedNo: 'EK-03', specimenType: '血清', specimenNo: 'SP20240006', reportItemName: '肺炎克雷伯菌', resultValue: '2.5×10^4CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 0, organismName: '肺炎克雷伯菌', reportTime: new Date(2024, 6, 20, 8, 30), operator: zlUser.name, reviewer: null, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML20240007', patientName: '郑军七', dept: '外科', bedNo: 'WK-08', specimenType: '痰液', specimenNo: 'SP20240007', reportItemName: '大肠埃希菌', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 0, organismName: '大肠埃希菌', reportTime: new Date(2024, 6, 21, 13, 15), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML20240008', patientName: '王秀八', dept: '妇产科', bedNo: 'FK-02', specimenType: '尿液', specimenNo: 'SP20240008', reportItemName: '白色念珠菌', resultValue: '阳性', referenceRange: '阴性', isAbnormal: 1, isMDRO: 0, organismName: '白色念珠菌', reportTime: new Date(2024, 6, 22, 10, 0), operator: zlUser.name, reviewer: null, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML20240009', patientName: '冯杰九', dept: '急诊科', bedNo: 'JK-01', specimenType: '肺泡灌洗液', specimenNo: 'SP20240009', reportItemName: '鲍曼不动杆菌[CRAB]', resultValue: '阳性', referenceRange: '阴性', isAbnormal: 1, isMDRO: 1, mdroType: 'CRAB', organismName: '耐碳青霉烯类鲍曼不动杆菌', reportTime: new Date(2024, 6, 23, 15, 45), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 1, status: '已审核' },
      { patientId: 'ML20240010', patientName: '陈敏十', dept: '血液科', bedNo: 'XY-04', specimenType: '血液', specimenNo: 'SP20240010', reportItemName: '表皮葡萄球菌', resultValue: '阳性', referenceRange: '阴性', isAbnormal: 0, isMDRO: 0, organismName: '表皮葡萄球菌', reportTime: new Date(2024, 6, 24, 9, 30), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 0, status: '已审核' },
      { patientId: 'ML20240011', patientName: '黄明一', dept: 'ICU', bedNo: 'ICU-09', specimenType: '痰液', specimenNo: 'SP20240011', reportItemName: '肺炎克雷伯菌[CRKP]', resultValue: '≥10^5CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 1, mdroType: 'CRKP', organismName: '耐碳青霉烯类肺炎克雷伯菌', reportTime: new Date(2024, 6, 25, 11, 0), operator: zlUser.name, reviewer: gkUser.name, warningTriggered: 1, status: '已审核' },
      { patientId: 'ML20240012', patientName: '杨华二', dept: '肿瘤科', bedNo: 'ZL-06', specimenType: '痰液', specimenNo: 'SP20240012', reportItemName: '铜绿假单胞菌', resultValue: '5×10^3CFU/ml', referenceRange: '<10^3CFU/ml', isAbnormal: 1, isMDRO: 0, organismName: '铜绿假单胞菌', reportTime: new Date(2024, 6, 26, 14, 30), operator: zlUser.name, reviewer: null, warningTriggered: 0, status: '已审核' },
    ];
    await db.microLabResult.createMany({ data: microLabData });

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: { users: 5, roles: 3, permissions: permissionDefs.length, menus: menuDefs.length }
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
