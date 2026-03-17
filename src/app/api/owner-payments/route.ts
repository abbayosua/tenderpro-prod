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

    // Get all projects for this owner
    const projects = await db.project.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, budget: true },
    });

    const projectIds = projects.map(p => p.id);
    const projectMap = new Map(projects.map(p => [p.id, { title: p.title, budget: p.budget }]));

    if (projectIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalBudget: 0,
          totalPaid: 0,
          totalPending: 0,
        },
        payments: [],
      });
    }

    // Get all milestones for these projects
    const milestones = await db.projectMilestone.findMany({
      where: {
        projectId: { in: projectIds },
        ...(projectId && projectId !== 'all' ? { projectId } : {}),
      },
      include: {
        payments: true,
        project: {
          select: { title: true },
        },
      },
    });

    // Calculate summary
    const totalBudget = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    
    let totalPaid = 0;
    let totalPending = 0;
    const allPayments: Array<{
      id: string;
      project: string;
      milestone: string;
      amount: number;
      status: string;
      date: string;
      method: string;
    }> = [];

    milestones.forEach(milestone => {
      milestone.payments.forEach(payment => {
        if (payment.status === 'CONFIRMED') {
          totalPaid += payment.amount;
        } else if (payment.status === 'PENDING') {
          totalPending += payment.amount;
        }

        allPayments.push({
          id: payment.id,
          project: milestone.project.title,
          milestone: milestone.title,
          amount: payment.amount,
          status: payment.status,
          date: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending',
          method: payment.method || 'Transfer Bank',
        });
      });
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
    });
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    return NextResponse.json({
      summary: { totalBudget: 0, totalPaid: 0, totalPending: 0 },
      payments: [],
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
