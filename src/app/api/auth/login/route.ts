import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    const user = await db.user.findUnique({
      where: { email },
      include: {
        contractor: true,
        owner: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email tidak ditemukan' },
        { status: 401 }
      );
    }

    if (user.role !== role) {
      return NextResponse.json(
        { success: false, message: 'Role tidak sesuai dengan akun Anda' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Password salah' },
        { status: 401 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        name: userWithoutPassword.name,
        phone: userWithoutPassword.phone,
        role: userWithoutPassword.role,
        avatar: userWithoutPassword.avatar,
        isVerified: userWithoutPassword.isVerified,
        verificationStatus: userWithoutPassword.verificationStatus,
      },
      profile: userWithoutPassword.contractor || userWithoutPassword.owner,
      token: `token-${user.id}-${Date.now()}`,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
