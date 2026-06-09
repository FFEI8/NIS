import { NextResponse } from 'next/server';

// In-memory audit log (would be a database table in production)
const auditLogs: any[] = [
  { id: '1', user: '系统管理员', action: '登录系统', module: '系统', ip: '192.168.1.100', time: new Date(Date.now() - 3600000).toISOString(), detail: '管理员账号登录' },
  { id: '2', user: '张感控', action: '新增感染病例', module: '感染监测', ip: '192.168.1.101', time: new Date(Date.now() - 7200000).toISOString(), detail: '新增ICU感染病例1例' },
  { id: '3', user: '李医生', action: '处理预警', module: '感染监测', ip: '192.168.1.102', time: new Date(Date.now() - 10800000).toISOString(), detail: '确认暴发预警1条' },
  { id: '4', user: '系统管理员', action: '修改角色权限', module: '系统管理', ip: '192.168.1.100', time: new Date(Date.now() - 14400000).toISOString(), detail: '修改感控专员角色菜单权限' },
  { id: '5', user: '王护士', action: '新增环境监测', module: '环境监测', ip: '192.168.1.103', time: new Date(Date.now() - 18000000).toISOString(), detail: '录入手术室空气采样记录' },
  { id: '6', user: '赵检验', action: '审核监测记录', module: '环境监测', ip: '192.168.1.104', time: new Date(Date.now() - 21600000).toISOString(), detail: '审核ICU环境监测记录' },
  { id: '7', user: '张感控', action: '生成感染报告', module: '数据分析', ip: '192.168.1.101', time: new Date(Date.now() - 25200000).toISOString(), detail: '生成2024年7月感染监测月报' },
  { id: '8', user: '系统管理员', action: '新增用户', module: '系统管理', ip: '192.168.1.100', time: new Date(Date.now() - 28800000).toISOString(), detail: '新增用户：赵检验' },
  { id: '9', user: '李医生', action: '上报职业暴露', module: '职业安全', ip: '192.168.1.102', time: new Date(Date.now() - 32400000).toISOString(), detail: '上报针刺伤事件1例' },
  { id: '10', user: '系统管理员', action: '系统初始化', module: '系统', ip: '127.0.0.1', time: new Date(Date.now() - 36000000).toISOString(), detail: '初始化系统数据和演示数据' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const moduleFilter = searchParams.get('module') || '';
    const userFilter = searchParams.get('user') || '';

    let filtered = [...auditLogs];

    if (moduleFilter) {
      filtered = filtered.filter(log => log.module === moduleFilter);
    }
    if (userFilter) {
      filtered = filtered.filter(log => log.user.includes(userFilter));
    }

    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
