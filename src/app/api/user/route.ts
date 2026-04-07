import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        contractor: {
          include: {
            portfolios: true,
          },
        },
        owner: true,
        documents: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;

    // Get stats for contractor
    let stats: Record<string, unknown> | null = null;
    if (user.role === 'CONTRACTOR' && user.contractor) {
      const totalBids = await db.bid.count({
        where: { contractorId: userId },
      });
      const acceptedBids = await db.bid.count({
        where: { contractorId: userId, status: 'ACCEPTED' },
      });
      const pendingBids = await db.bid.count({
        where: { contractorId: userId, status: 'PENDING' },
      });

      stats = {
        totalBids,
        acceptedBids,
        pendingBids,
        winRate: totalBids > 0 ? ((acceptedBids / totalBids) * 100).toFixed(1) : 0,
      };
    }

    // Get stats for owner
    if (user.role === 'OWNER') {
      const totalProjects = await db.project.count({
        where: { ownerId: userId },
      });
      const activeProjects = await db.project.count({
        where: { ownerId: userId, status: 'IN_PROGRESS' },
      });
      const openProjects = await db.project.count({
        where: { ownerId: userId, status: 'OPEN' },
      });

      stats = {
        totalProjects,
        activeProjects,
        openProjects,
      };
    }

    return NextResponse.json({
      user: userWithoutPassword,
      stats,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
