import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId wajib diisi' },
        { status: 400 }
      );
    }

    // Get all projects for this owner with payment data
    const projects = await db.project.findMany({
      where: { ownerId: userId },
      include: {
        milestones: {
          include: {
            payments: {
              where: { status: { in: ['PAID', 'CONFIRMED'] } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalBudget = 0;
    let totalSpent = 0;
    const projectBudgets = [];
    const alerts = [];

    for (const project of projects) {
      const budget = project.budget || 0;
      totalBudget += budget;

      // Calculate spent from confirmed payments
      let spent = 0;
      for (const milestone of project.milestones) {
        for (const payment of milestone.payments) {
          spent += payment.amount || 0;
        }
      }

      totalSpent += spent;
      const remaining = budget - spent;
      const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      projectBudgets.push({
        id: project.id,
        title: project.title,
        budget,
        spent,
        remaining,
        percentage,
        status: project.status,
      });

      // Generate alerts
      if (budget > 0 && percentage >= 100) {
        alerts.push({
          projectId: project.id,
          projectTitle: project.title,
          type: 'OVER_BUDGET',
          message: `Anggaran untuk "${project.title}" sudah melampaui batas!`,
          severity: 'high',
        });
      } else if (budget > 0 && percentage >= 80) {
        alerts.push({
          projectId: project.id,
          projectTitle: project.title,
          type: 'APPROACHING_LIMIT',
          message: `Pengeluaran untuk "${project.title}" sudah mencapai ${percentage}% dari anggaran`,
          severity: 'warning',
        });
      } else if (budget > 0 && percentage >= 60) {
        alerts.push({
          projectId: project.id,
          projectTitle: project.title,
          type: 'WATCH',
          message: `Pengeluaran untuk "${project.title}" sudah mencapai ${percentage}% dari anggaran`,
          severity: 'info',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        projects: projectBudgets,
        alerts,
      },
    });
  } catch (error) {
    console.error('Gagal memuat data budget tracker:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat data budget' },
      { status: 500 }
    );
  }
}
