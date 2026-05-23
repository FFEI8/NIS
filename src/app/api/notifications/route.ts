import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get recent warnings as notifications
    const pendingWarnings = await db.warningRecord.findMany({
      where: { status: '待处理' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get pending reviews
    const pendingReviews = await db.environmentalMonitor.findMany({
      where: { reviewStatus: '待审核' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get recent infection cases pending review
    const pendingCases = await db.infectionCase.findMany({
      where: { status: '待审核' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Build notification items
    const notifications: any[] = [];

    pendingWarnings.forEach(w => {
      notifications.push({
        id: `warning-${w.id}`,
        type: 'warning',
        title: `预警：${w.patientName} - ${w.warningType}`,
        description: w.description,
        time: w.createdAt,
        read: false,
        priority: w.warningLevel === '高' ? 'high' : w.warningLevel === '中' ? 'medium' : 'low',
      });
    });

    pendingReviews.forEach(r => {
      notifications.push({
        id: `review-${r.id}`,
        type: 'approval',
        title: `待审核：${r.dept} - ${r.sampleType}监测`,
        description: `采样点：${r.samplePoint}，结果：${r.result || '待出'}`,
        time: r.createdAt,
        read: false,
        priority: 'medium',
      });
    });

    pendingCases.forEach(c => {
      notifications.push({
        id: `case-${c.id}`,
        type: 'info',
        title: `新病例：${c.patientName} - ${c.infectionSite}`,
        description: `科室：${c.dept}，病原体：${c.pathogen || '待定'}`,
        time: c.createdAt,
        read: false,
        priority: 'low',
      });
    });

    // Add system notifications
    notifications.push({
      id: 'system-1',
      type: 'system',
      title: '系统通知',
      description: '医院感染管理系统已更新至最新版本，新增暗黑模式支持',
      time: new Date(),
      read: false,
      priority: 'low',
    });

    // Sort by time
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
