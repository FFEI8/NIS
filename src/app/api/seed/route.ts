import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Clean all tables
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
    await db.user.deleteMany();
    await db.role.deleteMany();
    await db.permission.deleteMany();
    await db.menu.deleteMany();

    // ========== Create Permissions ==========
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
    ];

    const permissions = [];
    for (let i = 0; i < permissionDefs.length; i++) {
      const p = permissionDefs[i];
      permissions.push(await db.permission.create({ data: { ...p, sort: i } }));
    }

    // ========== Create Menus ==========
    const menuDefs = [
      { name: '首页', code: 'dashboard', path: '/dashboard', icon: 'LayoutDashboard', type: 'menu', sort: 0 },
      { name: '感染监测', code: 'infection-monitor', icon: 'Activity', type: 'directory', sort: 1 },
      { name: '感染病例', code: 'infection-case', path: '/infection/cases', icon: 'FileText', type: 'menu', parentCode: 'infection-monitor', sort: 0 },
      { name: '智能预警', code: 'infection-warning', path: '/infection/warnings', icon: 'AlertTriangle', type: 'menu', parentCode: 'infection-monitor', sort: 1 },
      { name: '目标监测', code: 'infection-target', path: '/infection/target', icon: 'Target', type: 'menu', parentCode: 'infection-monitor', sort: 2 },
      { name: '数据分析', code: 'data-analysis', icon: 'BarChart3', type: 'directory', sort: 2 },
      { name: '统计分析', code: 'data-statistics', path: '/data/statistics', icon: 'PieChart', type: 'menu', parentCode: 'data-analysis', sort: 0 },
      { name: '感染报告', code: 'data-report', path: '/data/reports', icon: 'FileSpreadsheet', type: 'menu', parentCode: 'data-analysis', sort: 1 },
      { name: '环境监测', code: 'env-monitor', icon: 'ShieldCheck', type: 'directory', sort: 3 },
      { name: '环境卫生', code: 'env-hygiene', path: '/env/hygiene', icon: 'Droplets', type: 'menu', parentCode: 'env-monitor', sort: 0 },
      { name: '消毒灭菌', code: 'env-sterilization', path: '/env/sterilization', icon: 'Flame', type: 'menu', parentCode: 'env-monitor', sort: 1 },
      { name: '职业安全', code: 'occupational-safety', icon: 'HardHat', type: 'directory', sort: 4 },
      { name: '职业暴露', code: 'occupational-exposure', path: '/occupational/exposure', icon: 'ShieldAlert', type: 'menu', parentCode: 'occupational-safety', sort: 0 },
      { name: '手卫生监测', code: 'hand-hygiene', path: '/occupational/hand-hygiene', icon: 'Hand', type: 'menu', parentCode: 'occupational-safety', sort: 1 },
      { name: '抗菌药物', code: 'antibiotic', path: '/antibiotic/usage', icon: 'Pill', type: 'menu', sort: 5 },
      { name: '系统管理', code: 'system', icon: 'Settings', type: 'directory', sort: 6 },
      { name: '用户管理', code: 'system-user', path: '/system/users', icon: 'Users', type: 'menu', parentCode: 'system', sort: 0 },
      { name: '角色管理', code: 'system-role', path: '/system/roles', icon: 'UserCog', type: 'menu', parentCode: 'system', sort: 1 },
      { name: '菜单管理', code: 'system-menu', path: '/system/menus', icon: 'Menu', type: 'menu', parentCode: 'system', sort: 2 },
      { name: '权限管理', code: 'system-permission', path: '/system/permissions', icon: 'KeyRound', type: 'menu', parentCode: 'system', sort: 3 },
    ];

    const menuMap = new Map<string, string>();
    const menus = [];
    for (const def of menuDefs) {
      const parentId = def.parentCode ? menuMap.get(def.parentCode) || null : null;
      const m = await db.menu.create({
        data: {
          parentId,
          name: def.name,
          code: def.code,
          path: def.path || null,
          icon: def.icon || null,
          type: def.type,
          sort: def.sort,
          visible: 1,
          status: 1,
        },
      });
      menuMap.set(def.code, m.id);
      menus.push(m);
    }

    // ========== Create Roles ==========
    const superAdmin = await db.role.create({ data: { code: 'super_admin', name: '超级管理员', description: '拥有系统所有权限', sort: 0, status: 1 } });
    const infectionControl = await db.role.create({ data: { code: 'infection_control', name: '感控专员', description: '感染管理相关权限', sort: 1, status: 1 } });
    const clinicalDoctor = await db.role.create({ data: { code: 'clinical_doctor', name: '临床医师', description: '基本查看和上报权限', sort: 2, status: 1 } });

    // Assign all permissions & menus to super admin
    await db.rolePermission.createMany({ data: permissions.map(p => ({ roleId: superAdmin.id, permissionId: p.id })) });
    await db.roleMenu.createMany({ data: menus.map(m => ({ roleId: superAdmin.id, menuId: m.id })) });

    // Assign infection permissions to infection control
    const infectionPermIds = permissions.filter(p => p.code.startsWith('infection:') || p.code.startsWith('system:role:') || p.code.startsWith('system:menu:')).map(p => p.id);
    await db.rolePermission.createMany({ data: infectionPermIds.map(pid => ({ roleId: infectionControl.id, permissionId: pid })) });
    const infectionMenuIds = menus.filter(m => ['dashboard', 'infection-monitor', 'infection-case', 'infection-warning', 'infection-target', 'data-analysis', 'data-statistics', 'data-report', 'env-monitor', 'env-hygiene', 'env-sterilization', 'occupational-safety', 'occupational-exposure', 'hand-hygiene', 'antibiotic'].includes(m.code)).map(m => m.id);
    await db.roleMenu.createMany({ data: infectionMenuIds.map(mid => ({ roleId: infectionControl.id, menuId: mid })) });

    // Assign basic permissions to clinical doctor
    const clinicalPermIds = permissions.filter(p => ['infection:case:list', 'infection:case:add', 'infection:warning:list', 'infection:exposure:list', 'infection:exposure:add', 'infection:handhygiene:list'].includes(p.code)).map(p => p.id);
    await db.rolePermission.createMany({ data: clinicalPermIds.map(pid => ({ roleId: clinicalDoctor.id, permissionId: pid })) });
    const clinicalMenuIds = menus.filter(m => ['dashboard', 'infection-monitor', 'infection-case', 'infection-warning', 'occupational-safety', 'occupational-exposure', 'hand-hygiene'].includes(m.code)).map(m => m.id);
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

    // ========== Create Sample Infection Cases ==========
    const depts = ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '血液科', '肿瘤科'];
    const sites = ['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道', '中枢神经'];
    const pathogens = ['大肠埃希菌', '金黄色葡萄球菌', '耐甲氧西林金黄色葡萄球菌(MRSA)', '铜绿假单胞菌', '肺炎克雷伯菌', '耐碳青霉烯类肺炎克雷伯菌(CRKP)', '鲍曼不动杆菌', '白色念珠菌', '表皮葡萄球菌', '阴沟肠杆菌'];
    const outcomes = ['治愈', '好转', '未愈', '死亡'];
    const statuses = ['待审核', '已确认', '已排除'];

    for (let i = 0; i < 25; i++) {
      const infectionDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const admissionDate = new Date(infectionDate.getTime() - Math.random() * 30 * 86400000);
      await db.infectionCase.create({
        data: {
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
        },
      });
    }

    // ========== Create Sample Warnings ==========
    const warningTypes = ['病例预警', '聚集预警', '暴发预警'];
    const warningLevels = ['高', '中', '低'];
    const warningStatuses = ['待处理', '已确认', '已排除', '已处理'];

    for (let i = 0; i < 15; i++) {
      await db.warningRecord.create({
        data: {
          patientId: `P${String(20240030 + i).padStart(8, '0')}`,
          patientName: `${['孙', '周', '吴', '郑', '冯', '褚', '卫', '蒋'][i % 8]}${['文', '武', '成', '康', '德', '建', '国', '安'][i % 8]}`,
          dept: depts[i % depts.length],
          warningType: warningTypes[i % 3],
          warningLevel: warningLevels[i % 3],
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
          status: warningStatuses[i % 4],
          handler: i % 2 === 0 ? gkUser.name : null,
          handleResult: i % 4 === 0 ? '已确认感染，启动防控措施' : i % 4 === 1 ? '排除感染，为其他原因导致' : null,
          handleTime: i % 2 === 0 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
        },
      });
    }

    // ========== Create Environmental Monitor Records ==========
    const sampleTypes = ['空气', '物体表面', '医务人员手'];
    const samplePoints = ['手术室', 'ICU', '产房', '新生儿室', '供应室', '治疗室', '换药室'];

    for (let i = 0; i < 20; i++) {
      const isQualified = Math.random() > 0.2;
      await db.environmentalMonitor.create({
        data: {
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
        },
      });
    }

    // ========== Create Sterilization Monitor Records ==========
    const methods = ['高压蒸汽', '环氧乙烷', '等离子'];
    const sterStatuses = ['待检测', '合格', '不合格'];

    for (let i = 0; i < 12; i++) {
      const isQualified = Math.random() > 0.1;
      await db.sterilizationMonitor.create({
        data: {
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
        },
      });
    }

    // ========== Create Occupational Exposure Records ==========
    const exposureTypes = ['针刺伤', '血液体液暴露', '其他'];
    const expStatuses = ['已上报', '评估中', '随访中', '已结案'];

    for (let i = 0; i < 10; i++) {
      await db.occupationalExposure.create({
        data: {
          staffName: `${['钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚'][i]}${['护士', '医生', '技师', '护理员'][i % 4]}`,
          staffDept: depts[i % depts.length],
          exposureType: exposureTypes[i % 3],
          exposureSource: `患者P${String(20240050 + i).padStart(8, '0')}`,
          exposurePart: ['左手食指', '右手前臂', '左眼结膜', '口腔黏膜'][i % 4],
          exposureDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          emergencyAction: ['立即挤压伤口并冲洗', '立即冲洗消毒', '立即冲洗并报告', '紧急处理后报告'][i % 4],
          riskLevel: warningLevels[i % 3],
          followUpPlan: i % 2 === 0 ? '随访3个月，检测HBV、HCV、HIV' : '随访6个月，定期检测',
          followUpResult: i % 4 === 0 ? '随访期未发现感染' : null,
          status: expStatuses[i % 4],
        },
      });
    }

    // ========== Create Antibiotic Usage Records ==========
    const abDepts = ['ICU', '外科', '内科', '儿科', '妇产科'];

    for (let m = 7; m <= 12; m++) {
      for (const dept of abDepts) {
        const totalPatients = 80 + Math.floor(Math.random() * 120);
        const rate = dept === 'ICU' ? 60 + Math.random() * 20 : dept === '外科' ? 40 + Math.random() * 15 : 25 + Math.random() * 15;
        const antibioticPatients = Math.round(totalPatients * rate / 100);
        await db.antibioticUsage.create({
          data: {
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
          },
        });
      }
    }

    // ========== Create Hand Hygiene Records ==========
    const hhDepts = ['ICU', '外科', '内科', '儿科', '妇产科'];

    for (let m = 7; m <= 12; m++) {
      for (const dept of hhDepts) {
        const total = 200 + Math.floor(Math.random() * 300);
        const baseRate = dept === 'ICU' ? 80 + Math.random() * 10 : 65 + Math.random() * 20;
        const compliant = Math.round(total * baseRate / 100);
        await db.handHygiene.create({
          data: {
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
          },
        });
      }
    }

    // ========== Create Infection Reports ==========
    const reportTypes = ['月报', '季报', '年报', '专项'];
    const reportStatuses = ['草稿', '已提交', '已审核'];

    for (let i = 0; i < 6; i++) {
      await db.infectionReport.create({
        data: {
          title: [
            '2024年7月医院感染监测月报',
            '2024年第三季度感染监测季报',
            'ICU多重耐药菌专项分析报告',
            '2024年8月医院感染监测月报',
            '手术部位感染专项调查报告',
            '2024年9月医院感染监测月报',
          ][i],
          type: reportTypes[i % 4],
          period: ['2024-07', '2024-Q3', '2024-ICU-MDRO', '2024-08', '2024-SSI', '2024-09'][i],
          content: `## 感染监测报告\n\n本周期共监测住院患者XXX人次，发生医院感染XX例次，医院感染发病率X.XX%。\n\n### 重点指标\n- 抗菌药物使用率：XX.X%\n- 手卫生依从率：XX.X%\n- 多重耐药菌检出率：XX.X%\n\n### 建议\n1. 加强手卫生管理\n2. 规范抗菌药物使用\n3. 强化重点科室感染防控`,
          author: gkUser.name,
          status: reportStatuses[i % 3],
        },
      });
    }

    return NextResponse.json({ success: true, message: '数据库初始化成功', data: { users: 5, roles: 3, permissions: permissions.length, menus: menus.length } });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
