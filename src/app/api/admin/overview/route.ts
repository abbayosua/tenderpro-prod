import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_KEY = 'admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Simple API key check for security
    if (key !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Kunci admin tidak valid.' },
        { status: 403 }
      );
    }

    // Fetch all stats in parallel
    const [
      totalUsers,
      ownerUsers,
      contractorUsers,
      adminUsers,
      totalProjects,
      draftProjects,
      openProjects,
      inProgressProjects,
      completedProjects,
      cancelledProjects,
      totalBids,
      acceptedBids,
      pendingBids,
      rejectedBids,
      totalRevenue,
      recentSignups,
      recentDisputes,
      openDisputes,
      verifiedUsers,
      totalReviews,
      totalDocuments,
      totalPortfolios,
      totalCertifications,
    ] = await Promise.all([
      // Total users
      db.user.count(),
      // Users by role
      db.user.count({ where: { role: 'OWNER' } }),
      db.user.count({ where: { role: 'CONTRACTOR' } }),
      db.user.count({ where: { role: 'ADMIN' } }),
      // Total projects
      db.project.count(),
      // Projects by status
      db.project.count({ where: { status: 'DRAFT' } }),
      db.project.count({ where: { status: 'OPEN' } }),
      db.project.count({ where: { status: 'IN_PROGRESS' } }),
      db.project.count({ where: { status: 'COMPLETED' } }),
      db.project.count({ where: { status: 'CANCELLED' } }),
      // Total bids
      db.bid.count(),
      // Bids by status
      db.bid.count({ where: { status: 'ACCEPTED' } }),
      db.bid.count({ where: { status: 'PENDING' } }),
      db.bid.count({ where: { status: 'REJECTED' } }),
      // Revenue from accepted bids
      db.bid.aggregate({ _sum: { price: true }, where: { status: 'ACCEPTED' } }),
      // Recent signups (last 10)
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      // Recent disputes
      db.dispute.count({ where: { status: 'OPEN' } }),
      // All disputes
      db.dispute.count(),
      // Verified users
      db.user.count({ where: { isVerified: true } }),
      // Reviews count
      db.review.count(),
      // Documents count
      db.document.count(),
      // Portfolios count
      db.portfolio.count(),
      // Certifications count
      db.certification.count(),
    ]);

    // Platform health metrics
    const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
    const acceptanceRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;
    const openDisputeRate = totalProjects > 0 ? Math.round((recentDisputes / totalProjects) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        // Users
        totalUsers,
        usersByRole: {
          owners: ownerUsers,
          contractors: contractorUsers,
          admins: adminUsers,
        },
        verifiedUsers,
        recentSignups,
        verificationRate,

        // Projects
        totalProjects,
        projectsByStatus: {
          draft: draftProjects,
          open: openProjects,
          inProgress: inProgressProjects,
          completed: completedProjects,
          cancelled: cancelledProjects,
        },

        // Bids
        totalBids,
        bidsByStatus: {
          accepted: acceptedBids,
          pending: pendingBids,
          rejected: rejectedBids,
        },

        // Revenue
        totalRevenue: totalRevenue._sum.price || 0,

        // Disputes
        totalDisputes: recentDisputes,
        openDisputes,

        // Other metrics
        totalReviews,
        totalDocuments,
        totalPortfolios,
        totalCertifications,

        // Platform health
        healthMetrics: {
          verificationRate,
          completionRate,
          acceptanceRate,
          openDisputeRate,
          overallHealth: Math.round((verificationRate * 0.3 + completionRate * 0.4 + acceptanceRate * 0.2 + (100 - openDisputeRate) * 0.1)),
        },
      },
    });
  } catch (error) {
    console.error('Gagal memuat admin overview:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat data admin' },
      { status: 500 }
    );
  }
}
