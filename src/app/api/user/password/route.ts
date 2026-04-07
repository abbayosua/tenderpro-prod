import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Change user password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword, confirmPassword } = body;

    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password baru minimal 8 karakter' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Konfirmasi password tidak cocok' },
        { status: 400 }
      );
    }

    // Get current user with password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Simple password comparison (in production, use bcrypt)
    // The existing auth system stores passwords, we compare directly
    if (user.password !== currentPassword) {
      return NextResponse.json(
        { error: 'Password saat ini salah' },
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
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}
