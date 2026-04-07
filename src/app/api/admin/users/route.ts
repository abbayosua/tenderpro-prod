import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole, VerificationStatus } from '@prisma/client';

const ADMIN_KEY = 'admin';

// GET - List all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Kunci admin tidak valid.' },
        { status: 403 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };

    if (role && ['OWNER', 'CONTRACTOR', 'ADMIN'].includes(role)) {
      where.role = role as UserRole;
    }

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    } else if (status === 'pending_verification') {
      where.verificationStatus = 'PENDING';
    } else if (status === 'rejected') {
      where.verificationStatus = 'REJECTED';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          contractor: {
            select: {
              id: true,
              companyName: true,
              specialization: true,
              experienceYears: true,
              rating: true,
              city: true,
            },
          },
          owner: {
            select: {
              id: true,
              companyName: true,
              totalProjects: true,
              activeProjects: true,
            },
          },
          _count: {
            select: {
              projects: true,
              bids: true,
              givenReviews: true,
              receivedReviews: true,
              certifications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      avatar: u.avatar,
      isVerified: u.isVerified,
      verificationStatus: u.verificationStatus,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      profile: u.role === 'CONTRACTOR' ? u.contractor : u.owner,
      stats: u._count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        total,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Gagal memuat daftar pengguna:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat daftar pengguna' },
      { status: 500 }
    );
  }
}

// PUT - Update user status and role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, userId, action, reason, role: newRole } = body;

    if (key !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Kunci admin tidak valid.' },
        { status: 403 }
      );
    }

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID dan aksi diperlukan' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        contractor: true,
        owner: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    let actionDescription = '';

    switch (action) {
      case 'verify':
        updateData.isVerified = true;
        updateData.verificationStatus = 'VERIFIED';
        actionDescription = `Pengguna ${user.name} telah diverifikasi oleh admin`;
        break;

      case 'unverify':
        updateData.isVerified = false;
        updateData.verificationStatus = 'PENDING';
        actionDescription = `Verifikasi pengguna ${user.name} telah dicabut oleh admin. Alasan: ${reason || 'Tidak disebutkan'}`;
        break;

      case 'ban':
        updateData.isActive = false;
        updateData.isVerified = false;
        actionDescription = `Pengguna ${user.name} telah diban oleh admin. Alasan: ${reason || 'Melanggar ketentuan platform'}`;
        break;

      case 'unban':
        updateData.isActive = true;
        actionDescription = `Ban pengguna ${user.name} telah dicabut oleh admin`;
        break;

      case 'reject_verification':
        updateData.isVerified = false;
        updateData.verificationStatus = 'REJECTED';
        actionDescription = `Verifikasi pengguna ${user.name} ditolak. Alasan: ${reason || 'Dokumen tidak lengkap'}`;
        break;

      case 'update_role':
        if (!newRole || !['OWNER', 'CONTRACTOR', 'ADMIN'].includes(newRole)) {
          return NextResponse.json(
            { success: false, error: 'Peran tidak valid. Peran yang tersedia: OWNER, CONTRACTOR, ADMIN' },
            { status: 400 }
          );
        }
        if (user.role === newRole) {
          return NextResponse.json(
            { success: false, error: `Pengguna sudah memiliki peran ${newRole}` },
            { status: 400 }
          );
        }
        updateData.role = newRole as UserRole;
        actionDescription = `Peran pengguna ${user.name} diubah dari ${user.role} menjadi ${newRole}`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Aksi tidak valid: ${action}. Aksi yang tersedia: verify, unverify, ban, unban, reject_verification, update_role` },
          { status: 400 }
        );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        contractor: {
          select: {
            companyName: true,
            specialization: true,
            rating: true,
          },
        },
        owner: {
          select: {
            companyName: true,
            totalProjects: true,
          },
        },
      },
    });

    // Create activity log
    try {
      if (db.activityLog) {
        await db.activityLog.create({
          data: {
            userId: 'ADMIN',
            action: `ADMIN_${action.toUpperCase()}`,
            description: actionDescription,
            metadata: JSON.stringify({
              targetUserId: userId,
              targetUserName: user.name,
              previousRole: user.role,
              newRole: newRole || user.role,
              reason: reason || null,
            }),
          },
        });
      }
    } catch {
      // Log creation is non-critical
    }

    // Create notification for the user
    try {
      if (db.notification) {
        const notifTitle = (() => {
          switch (action) {
            case 'verify': return 'Akun Terverifikasi ✅';
            case 'unverify': return 'Verifikasi Dicabut ⚠️';
            case 'ban': return 'Akun Ditangguhkan 🚫';
            case 'unban': return 'Akun Diaktifkan Kembali ✅';
            case 'reject_verification': return 'Verifikasi Ditolak ❌';
            case 'update_role': return 'Peran Diperbarui 🔄';
            default: return 'Pembaruan Akun';
          }
        })();

        await db.notification.create({
          data: {
            userId,
            title: notifTitle,
            message: actionDescription,
            type: 'ACCOUNT_UPDATE',
          },
        });
      }
    } catch {
      // Notification creation is non-critical
    }

    return NextResponse.json({
      success: true,
      message: actionDescription,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        verificationStatus: updatedUser.verificationStatus,
        isActive: updatedUser.isActive,
        profile: updatedUser.role === 'CONTRACTOR' ? updatedUser.contractor : updatedUser.owner,
      },
    });
  } catch (error) {
    console.error('Gagal memperbarui pengguna:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memperbarui pengguna' },
      { status: 500 }
    );
  }
}

// DELETE - Soft-delete user (set isActive=false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const userId = searchParams.get('userId');
    const reason = searchParams.get('reason');

    if (key !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Kunci admin tidak valid.' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Pengguna sudah dinonaktifkan sebelumnya' },
        { status: 400 }
      );
    }

    // Soft-delete: set isActive=false
    await db.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        isVerified: false,
      },
    });

    // Create activity log
    try {
      if (db.activityLog) {
        await db.activityLog.create({
          data: {
            userId: 'ADMIN',
            action: 'ADMIN_SOFT_DELETE',
            description: `Pengguna ${user.name} (${user.email}) telah dinonaktifkan (soft-delete). Alasan: ${reason || 'Tidak disebutkan'}`,
            metadata: JSON.stringify({
              targetUserId: userId,
              targetUserName: user.name,
              targetUserEmail: user.email,
              reason: reason || null,
            }),
          },
        });
      }
    } catch {
      // Log creation is non-critical
    }

    return NextResponse.json({
      success: true,
      message: `Pengguna ${user.name} berhasil dinonaktifkan`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        deactivatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Gagal menonaktifkan pengguna:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menonaktifkan pengguna' },
      { status: 500 }
    );
  }
}
