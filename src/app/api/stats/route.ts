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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    let dashboardData = {};

    if (user.role === 'CONTRACTOR') {
      // Contractor dashboard stats
      const totalBids = await db.bid.count({
        where: { contractorId: userId },
      });
      const acceptedBids = await db.bid.count({
        where: { contractorId: userId, status: 'ACCEPTED' },
      });
      const pendingBids = await db.bid.count({
        where: { contractorId: userId, status: 'PENDING' },
      });
      const rejectedBids = await db.bid.count({
        where: { contractorId: userId, status: 'REJECTED' },
      });

      // Get monthly bid stats for the past 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const bids = await db.bid.findMany({
        where: {
          contractorId: userId,
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          status: true,
          price: true,
          createdAt: true,
        },
      });

      // Group by month
      const monthlyStats: Record<string, { total: number; accepted: number; value: number }> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      bids.forEach((bid) => {
        const monthKey = `${months[bid.createdAt.getMonth()]} ${bid.createdAt.getFullYear()}`;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { total: 0, accepted: 0, value: 0 };
        }
        monthlyStats[monthKey].total++;
        monthlyStats[monthKey].value += bid.price;
        if (bid.status === 'ACCEPTED') {
          monthlyStats[monthKey].accepted++;
        }
      });

      // Get recent bids with project info
      const recentBids = await db.bid.findMany({
        where: { contractorId: userId },
        include: {
          project: {
            include: {
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Get available projects for tender
      const availableProjects = await db.project.findMany({
        where: { status: 'OPEN' },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          bids: {
            where: { contractorId: userId },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      dashboardData = {
        totalBids,
        acceptedBids,
        pendingBids,
        rejectedBids,
        winRate: totalBids > 0 ? ((acceptedBids / totalBids) * 100).toFixed(1) : 0,
        monthlyStats,
        recentBids: recentBids.map((b) => ({
          id: b.id,
          price: b.price,
          status: b.status,
          createdAt: b.createdAt,
          project: {
            id: b.project.id,
            title: b.project.title,
            category: b.project.category,
            location: b.project.location,
            budget: b.project.budget,
            owner: {
              name: b.project.owner.name,
            },
          },
        })),
        availableProjects: availableProjects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          location: p.location,
          budget: p.budget,
          duration: p.duration,
          bidCount: p.bids.length,
          hasBid: p.bids.length > 0,
          owner: {
            name: p.owner.name,
          },
        })),
      };
    } else if (user.role === 'OWNER') {
      // Owner dashboard stats
      const totalProjects = await db.project.count({
        where: { ownerId: userId },
      });
      const activeProjects = await db.project.count({
        where: { ownerId: userId, status: 'IN_PROGRESS' },
      });
      const openProjects = await db.project.count({
        where: { ownerId: userId, status: 'OPEN' },
      });
      const completedProjects = await db.project.count({
        where: { ownerId: userId, status: 'COMPLETED' },
      });

      // Get projects with bid counts
      const projects = await db.project.findMany({
        where: { ownerId: userId },
        include: {
          bids: {
            include: {
              contractor: {
                include: { contractor: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get total pending bids on owner's projects
      const totalPendingBids = await db.bid.count({
        where: {
          project: { ownerId: userId },
          status: 'PENDING',
        },
      });

      dashboardData = {
        totalProjects,
        activeProjects,
        openProjects,
        completedProjects,
        totalPendingBids,
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          location: p.location,
          budget: p.budget,
          status: p.status,
          bidCount: p.bids.length,
          bids: p.bids.map((b) => ({
            id: b.id,
            price: b.price,
            duration: b.duration,
            status: b.status,
            proposal: b.proposal,
            createdAt: b.createdAt,
            contractor: {
              id: b.contractor.id,
              name: b.contractor.name,
              isVerified: b.contractor.isVerified,
              company: b.contractor.contractor?.companyName,
              rating: b.contractor.contractor?.rating,
              totalProjects: b.contractor.contractor?.totalProjects,
            },
          })),
        })),
      };
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
