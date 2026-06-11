import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, oldPassword, newPassword } = await request.json();

    // Validate input
    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填项' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: '新密码长度不能少于6个字符' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // Validate old password
    if (user.password !== oldPassword) {
      return NextResponse.json(
        { success: false, message: '原密码不正确' },
        { status: 400 }
      );
    }

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error: any) {
    console.error('[auth/change-password] Error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
