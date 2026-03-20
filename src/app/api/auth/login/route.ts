import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validations';
import { generateAccessToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Input tidak valid',
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }
    
    const { email, password, role } = validationResult.data;

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        contractor: true,
        owner: true,
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email tidak ditemukan' },
        { status: 401 }
      );
    }

    // Verify role matches
    if (user.role !== role) {
      return NextResponse.json(
        { success: false, message: 'Role tidak sesuai dengan akun Anda' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Password salah' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Prepare response data
    const { password: _, ...userWithoutPassword } = user;
    
    const responseData = {
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
      token,
    };

    // Create response with cookie
    const response = NextResponse.json(responseData);
    
    // Set HTTP-only cookie for additional security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
