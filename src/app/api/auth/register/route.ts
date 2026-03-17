import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { UserRole, VerificationStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      role,
      // Contractor fields
      companyName,
      companyType,
      npwp,
      nib,
      address,
      city,
      province,
      postalCode,
      specialization,
      experienceYears,
      employeeCount,
      description,
      // Owner fields
      ownerCompanyName,
      ownerCompanyType,
      ownerNpwp,
      ownerAddress,
      ownerCity,
      ownerProvince,
      ownerPostalCode,
    } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, password, nama, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Validate contractor-specific fields
    if (role === 'CONTRACTOR' && !companyName) {
      return NextResponse.json(
        { success: false, message: 'Nama perusahaan wajib diisi untuk kontraktor' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with profile
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: role as UserRole,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
        // Create contractor profile if role is CONTRACTOR
        ...(role === 'CONTRACTOR' && {
          contractor: {
            create: {
              companyName: companyName || '',
              companyType: companyType || null,
              npwp: npwp || null,
              nib: nib || null,
              address: address || null,
              city: city || null,
              province: province || null,
              postalCode: postalCode || null,
              specialization: specialization || null,
              experienceYears: experienceYears ? parseInt(experienceYears) : 0,
              employeeCount: employeeCount ? parseInt(employeeCount) : 0,
              rating: 0,
              totalProjects: 0,
              completedProjects: 0,
              description: description || null,
            },
          },
        }),
        // Create owner profile if role is OWNER
        ...(role === 'OWNER' && {
          owner: {
            create: {
              companyName: ownerCompanyName || null,
              companyType: ownerCompanyType || null,
              npwp: ownerNpwp || null,
              address: ownerAddress || null,
              city: ownerCity || null,
              province: ownerProvince || null,
              postalCode: ownerPostalCode || null,
              totalProjects: 0,
              activeProjects: 0,
            },
          },
        }),
      },
      include: {
        contractor: true,
        owner: true,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Silakan login dengan akun Anda.',
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
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
