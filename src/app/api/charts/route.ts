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

    if (user.role === 'OWNER') {
      // Get all projects for this owner
      const projects = await db.project.findMany({
        where: { ownerId: userId },
        select: {
          category: true,
          status: true,
          createdAt: true,
          milestones: {
            select: {
              status: true,
            },
          },
        },
      });

      // Calculate category distribution
      const categoryCount: Record<string, number> = {};
      projects.forEach((p) => {
        const cat = p.category || 'Lainnya';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const totalProjects = projects.length;
      const categoryData = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        value: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
        count,
      }));

      // Sort by count descending
      categoryData.sort((a, b) => b.count - a.count);

      // Calculate monthly progress (last 6 months)
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      // Initialize monthly data
      const monthlyDataMap: Record<string, { proyek: number; selesai: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = months[d.getMonth()];
        monthlyDataMap[key] = { proyek: 0, selesai: 0 };
      }

      // Fill with actual data
      projects.forEach((p) => {
        const monthKey = months[p.createdAt.getMonth()];
        if (monthlyDataMap[monthKey] !== undefined) {
          monthlyDataMap[monthKey].proyek++;
          if (p.status === 'COMPLETED') {
            monthlyDataMap[monthKey].selesai++;
          }
        }
      });

      const monthlyProgressData = Object.entries(monthlyDataMap).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Calculate trends (compare with previous period)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentProjects = projects.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).length;
      const previousProjects = projects.filter(p => {
        const date = new Date(p.createdAt);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      }).length;

      const projectTrend = previousProjects > 0 
        ? Math.round(((recentProjects - previousProjects) / previousProjects) * 100) 
        : (recentProjects > 0 ? 100 : 0);

      // Calculate bid trend
      const recentBids = await db.bid.count({
        where: {
          project: { ownerId: userId },
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      const previousBids = await db.bid.count({
        where: {
          project: { ownerId: userId },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      });

      const bidTrend = previousBids > 0
        ? Math.round(((recentBids - previousBids) / previousBids) * 100)
        : (recentBids > 0 ? 100 : 0);

      return NextResponse.json({
        categoryData,
        monthlyProgressData,
        trends: {
          projectTrend,
          bidTrend,
        },
      });
    }

    return NextResponse.json({ error: 'Role tidak didukung' }, { status: 400 });
  } catch (error) {
    console.error('Get charts error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
