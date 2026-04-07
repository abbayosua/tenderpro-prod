import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get user's favorite contractors with total count
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 });
    }

    // Check if favorite model exists
    if (!db.favorite) {
      return NextResponse.json({
        favorites: [],
        total: 0,
        pagination: { page, limit, totalPages: 0 },
      });
    }

    const [favorites, total] = await Promise.all([
      db.favorite.findMany({
        where: { userId },
        include: {
          contractor: {
            include: {
              contractor: {
                include: {
                  portfolios: {
                    take: 3,
                    orderBy: { createdAt: 'desc' },
                  },
                  certifications: {
                    take: 3,
                    orderBy: { createdAt: 'desc' },
                  },
                  badges: {
                    take: 5,
                    orderBy: { earnedAt: 'desc' },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.favorite.count({ where: { userId } }),
    ]);

    const formattedFavorites = favorites.map((fav) => ({
      id: fav.id,
      notes: fav.notes,
      createdAt: fav.createdAt,
      contractor: {
        id: fav.contractor.id,
        name: fav.contractor.name,
        email: fav.contractor.email,
        avatar: fav.contractor.avatar,
        isVerified: fav.contractor.isVerified,
        verificationStatus: fav.contractor.verificationStatus,
        company: fav.contractor.contractor
          ? {
              name: fav.contractor.contractor.companyName,
              specialization: fav.contractor.contractor.specialization,
              experienceYears: fav.contractor.contractor.experienceYears,
              rating: fav.contractor.contractor.rating,
              totalProjects: fav.contractor.contractor.totalProjects,
              completedProjects: fav.contractor.contractor.completedProjects,
              city: fav.contractor.contractor.city,
              province: fav.contractor.contractor.province,
              employeeCount: fav.contractor.contractor.employeeCount,
            }
          : null,
        portfolios: fav.contractor.contractor?.portfolios || [],
        certifications: fav.contractor.contractor?.certifications || [],
        badges: fav.contractor.contractor?.badges || [],
      },
    }));

    return NextResponse.json({
      favorites: formattedFavorites,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Gagal memuat daftar favorit:', error);
    return NextResponse.json({
      favorites: [],
      total: 0,
      pagination: { page: 1, limit: 20, totalPages: 0 },
    });
  }
}

// POST - Add a contractor to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contractorId, notes } = body;

    if (!userId || !contractorId) {
      return NextResponse.json(
        { error: 'User ID dan ID kontraktor diperlukan' },
        { status: 400 }
      );
    }

    if (userId === contractorId) {
      return NextResponse.json(
        { error: 'Tidak dapat menambahkan diri sendiri ke daftar favorit' },
        { status: 400 }
      );
    }

    // Check if favorite model exists
    if (!db.favorite) {
      return NextResponse.json(
        { error: 'Fitur belum tersedia' },
        { status: 503 }
      );
    }

    // Verify both users exist
    const [owner, contractor] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.user.findUnique({
        where: { id: contractorId },
        include: { contractor: true },
      }),
    ]);

    if (!owner) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!contractor || contractor.role !== 'CONTRACTOR') {
      return NextResponse.json(
        { error: 'Kontraktor tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if already favorited (prevent duplicate)
    const existing = await db.favorite.findUnique({
      where: {
        userId_contractorId: { userId, contractorId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Kontraktor sudah ada di daftar favorit Anda' },
        { status: 409 }
      );
    }

    const favorite = await db.favorite.create({
      data: {
        userId,
        contractorId,
        notes: notes || null,
      },
    });

    // Create notification for the contractor
    try {
      if (db.notification) {
        await db.notification.create({
          data: {
            userId: contractorId,
            title: 'Ditambahkan ke Favorit ⭐',
            message: `${owner.name} menambahkan Anda ke daftar kontraktor favorit`,
            type: 'FAVORITED',
            relatedId: userId,
          },
        });
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      message: `${contractor.contractor?.companyName || contractor.name} berhasil ditambahkan ke favorit`,
      favorite,
    });
  } catch (error) {
    console.error('Gagal menambahkan favorit:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan ke daftar favorit' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a contractor from favorites
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const contractorId = request.nextUrl.searchParams.get('contractorId');
    const favoriteId = request.nextUrl.searchParams.get('id');

    // Check if favorite model exists
    if (!db.favorite) {
      return NextResponse.json(
        { error: 'Fitur belum tersedia' },
        { status: 503 }
      );
    }

    if (favoriteId) {
      const favorite = await db.favorite.findUnique({
        where: { id: favoriteId },
      });
      if (!favorite) {
        return NextResponse.json(
          { error: 'Favorit tidak ditemukan' },
          { status: 404 }
        );
      }
      await db.favorite.delete({
        where: { id: favoriteId },
      });
    } else if (userId && contractorId) {
      const existing = await db.favorite.findUnique({
        where: {
          userId_contractorId: { userId, contractorId },
        },
      });
      if (!existing) {
        return NextResponse.json(
          { error: 'Kontraktor tidak ditemukan di daftar favorit' },
          { status: 404 }
        );
      }
      await db.favorite.delete({
        where: {
          userId_contractorId: { userId, contractorId },
        },
      });
    } else {
      return NextResponse.json(
        { error: 'ID favorit atau kombinasi User ID + ID kontraktor diperlukan' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kontraktor berhasil dihapus dari daftar favorit',
    });
  } catch (error) {
    console.error('Gagal menghapus favorit:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus dari daftar favorit' },
      { status: 500 }
    );
  }
}
