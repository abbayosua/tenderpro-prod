import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get payment summary and history for owner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all projects for this owner with milestones and payments
    const projects = await db.project.findMany({
      where: { 
        ownerId: userId,
        ...(projectId && projectId !== 'all' ? { id: projectId } : {}),
      },
      select: { 
        id: true, 
        title: true, 
        budget: true,
        status: true,
        milestones: {
          include: {
            payments: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalBudget: 0,
          totalPaid: 0,
          totalPending: 0,
        },
        payments: [],
        milestoneBreakdown: [],
      });
    }

    // Calculate summary
    let totalBudget = 0;
    let totalPaid = 0;
    let totalPending = 0;
    const allPayments: Array<{
      id: string;
      project: string;
      projectId: string;
      milestone: string;
      milestoneId: string;
      amount: number;
      status: string;
      date: string;
      method: string;
    }> = [];

    // Build milestone breakdown by project
    const milestoneBreakdown: Array<{
      projectId: string;
      projectTitle: string;
      projectBudget: number;
      projectStatus: string;
      milestones: Array<{
        id: string;
        title: string;
        description: string | null;
        amount: number;
        paidAmount: number;
        pendingAmount: number;
        status: string;
        dueDate: string | null;
        completedAt: string | null;
        order: number;
        paymentCount: number;
        percentage: number;
      }>;
      totalMilestoneBudget: number;
      totalMilestonePaid: number;
      totalMilestonePending: number;
    }> = [];

    projects.forEach(project => {
      const projectBreakdown = {
        projectId: project.id,
        projectTitle: project.title,
        projectBudget: project.budget,
        projectStatus: project.status,
        milestones: [] as Array<{
          id: string;
          title: string;
          description: string | null;
          amount: number;
          paidAmount: number;
          pendingAmount: number;
          status: string;
          dueDate: string | null;
          completedAt: string | null;
          order: number;
          paymentCount: number;
          percentage: number;
        }>,
        totalMilestoneBudget: 0,
        totalMilestonePaid: 0,
        totalMilestonePending: 0,
      };

      let projectMilestoneBudget = 0;
      let projectMilestonePaid = 0;
      let projectMilestonePending = 0;

      project.milestones.forEach(milestone => {
        let milestonePaid = 0;
        let milestonePending = 0;
        const milestoneAmount = milestone.amount || 0;

        milestone.payments.forEach(payment => {
          if (payment.status === 'CONFIRMED') {
            milestonePaid += payment.amount;
          } else if (payment.status === 'PENDING') {
            milestonePending += payment.amount;
          }

          allPayments.push({
            id: payment.id,
            project: project.title,
            projectId: project.id,
            milestone: milestone.title,
            milestoneId: milestone.id,
            amount: payment.amount,
            status: payment.status,
            date: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending',
            method: payment.method || 'Transfer Bank',
          });
        });

        projectMilestoneBudget += milestoneAmount;
        projectMilestonePaid += milestonePaid;
        projectMilestonePending += milestonePending;

        projectBreakdown.milestones.push({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          amount: milestoneAmount,
          paidAmount: milestonePaid,
          pendingAmount: milestonePending,
          status: milestone.status,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
          completedAt: milestone.completedAt ? new Date(milestone.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
          order: milestone.order,
          paymentCount: milestone.payments.length,
          percentage: milestoneAmount > 0 ? Math.round((milestonePaid / milestoneAmount) * 100) : 0,
        });
      });

      projectBreakdown.totalMilestoneBudget = projectMilestoneBudget;
      projectBreakdown.totalMilestonePaid = projectMilestonePaid;
      projectBreakdown.totalMilestonePending = projectMilestonePending;

      totalBudget += projectMilestoneBudget;
      totalPaid += projectMilestonePaid;
      totalPending += projectMilestonePending;

      milestoneBreakdown.push(projectBreakdown);
    });

    // Sort payments by date descending
    allPayments.sort((a, b) => {
      if (a.date === 'Pending') return 1;
      if (b.date === 'Pending') return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({
      summary: {
        totalBudget,
        totalPaid,
        totalPending,
        remainingBudget: totalBudget - totalPaid - totalPending,
      },
      payments: allPayments.slice(0, 20), // Limit to 20 recent payments
      milestoneBreakdown,
    });
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    return NextResponse.json({
      summary: { totalBudget: 0, totalPaid: 0, totalPending: 0 },
      payments: [],
      milestoneBreakdown: [],
    });
  }
}

// POST - Create a payment for a milestone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { milestoneId, amount, method, transactionId, notes, proofUrl, userId } = body;

    if (!milestoneId || !amount || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership through project
    const milestone = await db.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone || milestone.project.ownerId !== userId) {
      return NextResponse.json({ error: 'Milestone not found or access denied' }, { status: 403 });
    }

    const payment = await db.payment.create({
      data: {
        milestoneId,
        amount,
        method: method || 'TRANSFER',
        transactionId,
        notes,
        proofUrl,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// PUT - Confirm a payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, userId } = body;

    if (!paymentId || !status || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        milestone: {
          include: { project: true },
        },
      },
    });

    if (!payment || payment.milestone.project.ownerId !== userId) {
      return NextResponse.json({ error: 'Payment not found or access denied' }, { status: 403 });
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
