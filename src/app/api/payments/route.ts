import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get payments (by milestone or project)
export async function GET(request: NextRequest) {
  try {
    const milestoneId = request.nextUrl.searchParams.get('milestoneId');
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    // Check if payment model exists
    if (!db.payment) {
      return NextResponse.json({ payments: [], summary: { totalPaid: 0, totalPending: 0, totalAmount: 0 } });
    }

    let payments = [];
    let summary = { totalPaid: 0, totalPending: 0, totalAmount: 0 };

    if (milestoneId) {
      payments = await db.payment.findMany({
        where: { milestoneId },
        orderBy: { createdAt: 'desc' }
      });
    } else if (projectId) {
      // Get all milestones for the project first
      // Check if projectMilestone model exists
      if (!db.projectMilestone) {
        return NextResponse.json({ payments: [], summary });
      }
      
      const milestones = await db.projectMilestone.findMany({
        where: { projectId },
        include: {
          payments: true
        }
      });

      payments = milestones.flatMap(m => 
        m.payments.map(p => ({
          ...p,
          milestoneTitle: m.title,
          milestoneId: m.id
        }))
      );

      // Calculate summary
      summary.totalAmount = milestones.reduce((acc, m) => acc + m.amount, 0);
      summary.totalPaid = payments
        .filter(p => p.status === 'CONFIRMED')
        .reduce((acc, p) => acc + p.amount, 0);
      summary.totalPending = payments
        .filter(p => p.status === 'PENDING')
        .reduce((acc, p) => acc + p.amount, 0);
    }

    return NextResponse.json({ payments, summary });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ payments: [], summary: { totalPaid: 0, totalPending: 0, totalAmount: 0 } });
  }
}

// POST - Create a payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { milestoneId, amount, method, transactionId, notes, proofUrl, paidAt } = body;

    if (!milestoneId || !amount) {
      return NextResponse.json({ error: 'Milestone ID and amount required' }, { status: 400 });
    }

    // Check if payment model exists
    if (!db.payment) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    const payment = await db.payment.create({
      data: {
        milestoneId,
        amount,
        method: method || 'TRANSFER',
        transactionId,
        notes,
        proofUrl,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// PUT - Confirm/reject payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, confirmedBy } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Payment ID and status required' }, { status: 400 });
    }

    // Check if payment model exists
    if (!db.payment) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    const updateData: {
      status: string;
      confirmedAt?: Date;
      confirmedBy?: string;
    } = { status };

    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
      updateData.confirmedBy = confirmedBy;
    }

    const payment = await db.payment.update({
      where: { id: paymentId },
      data: updateData
    });

    // If payment confirmed, update milestone payment status
    if (status === 'CONFIRMED' && db.projectMilestone) {
      const milestone = await db.projectMilestone.findUnique({
        where: { id: payment.milestoneId },
        include: { payments: true }
      });

      if (milestone) {
        const totalPaid = milestone.payments
          .filter(p => p.status === 'CONFIRMED')
          .reduce((acc, p) => acc + p.amount, 0) + payment.amount;

        let paymentStatus = 'UNPAID';
        if (totalPaid >= milestone.amount) {
          paymentStatus = 'PAID';
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL';
        }

        await db.projectMilestone.update({
          where: { id: milestone.id },
          data: {
            paymentStatus,
            paidAt: paymentStatus === 'PAID' ? new Date() : null
          }
        });
      }
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

// DELETE - Delete a payment
export async function DELETE(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    // Check if payment model exists
    if (!db.payment) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    await db.payment.delete({
      where: { id: paymentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
