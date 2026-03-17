import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BidStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const contractorId = searchParams.get('contractorId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    if (contractorId) {
      where.contractorId = contractorId;
    }
    if (status) {
      where.status = status as BidStatus;
    }

    const bids = await db.bid.findMany({
      where,
      include: {
        project: {
          include: {
            owner: {
              include: {
                owner: true,
              },
            },
          },
        },
        contractor: {
          include: {
            contractor: {
              include: {
                portfolios: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedBids = bids.map((b) => ({
      id: b.id,
      proposal: b.proposal,
      price: b.price,
      duration: b.duration,
      startDate: b.startDate,
      status: b.status,
      notes: b.notes,
      createdAt: b.createdAt,
      project: {
        id: b.project.id,
        title: b.project.title,
        description: b.project.description,
        category: b.project.category,
        location: b.project.location,
        budget: b.project.budget,
        status: b.project.status,
        owner: {
          id: b.project.owner.id,
          name: b.project.owner.name,
          email: b.project.owner.email,
          phone: b.project.owner.phone,
          company: b.project.owner.owner?.companyName,
        },
      },
      contractor: {
        id: b.contractor.id,
        name: b.contractor.name,
        email: b.contractor.email,
        phone: b.contractor.phone,
        isVerified: b.contractor.isVerified,
        verificationStatus: b.contractor.verificationStatus,
        company: b.contractor.contractor ? {
          id: b.contractor.contractor.id,
          name: b.contractor.contractor.companyName,
          type: b.contractor.contractor.companyType,
          specialization: b.contractor.contractor.specialization,
          experienceYears: b.contractor.contractor.experienceYears,
          rating: b.contractor.contractor.rating,
          totalProjects: b.contractor.contractor.totalProjects,
          completedProjects: b.contractor.contractor.completedProjects,
          city: b.contractor.contractor.city,
          description: b.contractor.contractor.description,
        } : null,
        portfolios: b.contractor.contractor?.portfolios || [],
      },
    }));

    return NextResponse.json({ bids: formattedBids });
  } catch (error) {
    console.error('Get bids error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, contractorId, proposal, price, duration, startDate } = body;

    // Check if bid already exists
    const existingBid = await db.bid.findUnique({
      where: {
        projectId_contractorId: {
          projectId,
          contractorId,
        },
      },
    });

    if (existingBid) {
      return NextResponse.json(
        { error: 'Anda sudah mengajukan penawaran untuk proyek ini' },
        { status: 400 }
      );
    }

    const bid = await db.bid.create({
      data: {
        projectId,
        contractorId,
        proposal,
        price,
        duration,
        startDate: startDate ? new Date(startDate) : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, bid });
  } catch (error) {
    console.error('Create bid error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bidId, status, notes } = body;

    const bid = await db.bid.update({
      where: { id: bidId },
      data: {
        status: status as BidStatus,
        notes,
        updatedAt: new Date(),
      },
    });

    // If bid is accepted, update project status
    if (status === 'ACCEPTED') {
      await db.project.update({
        where: { id: bid.projectId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return NextResponse.json({ success: true, bid });
  } catch (error) {
    console.error('Update bid error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
