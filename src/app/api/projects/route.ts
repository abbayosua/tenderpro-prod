import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const contractorId = searchParams.get('contractorId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status as ProjectStatus;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (contractorId) {
      // Get projects where contractor has bid
      const bids = await db.bid.findMany({
        where: { contractorId },
        select: { projectId: true },
      });
      const projectIds = [...new Set(bids.map(b => b.projectId))];
      where.id = { in: projectIds };
    }

    const projects = await db.project.findMany({
      where,
      include: {
        owner: {
          include: {
            owner: true,
          },
        },
        bids: {
          include: {
            contractor: {
              include: {
                contractor: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      location: p.location,
      budget: p.budget,
      startDate: p.startDate,
      endDate: p.endDate,
      duration: p.duration,
      status: p.status,
      requirements: p.requirements ? JSON.parse(p.requirements) : [],
      viewCount: p.viewCount,
      createdAt: p.createdAt,
      owner: {
        id: p.owner.id,
        name: p.owner.name,
        email: p.owner.email,
        phone: p.owner.phone,
        isVerified: p.owner.isVerified,
        company: p.owner.owner?.companyName,
      },
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
          email: b.contractor.email,
          isVerified: b.contractor.isVerified,
          company: b.contractor.contractor?.companyName,
          rating: b.contractor.contractor?.rating,
        },
      })),
    }));

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      ownerId, 
      title, 
      description, 
      category, 
      location, 
      budget, 
      duration, 
      requirements 
    } = body;

    if (!ownerId || !title || !budget) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Check if owner exists
    const owner = await db.ownerProfile.findUnique({
      where: { userId: ownerId },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner tidak ditemukan' },
        { status: 404 }
      );
    }

    const project = await db.project.create({
      data: {
        ownerId,
        title,
        description: description || '',
        category: category || 'Pembangunan Baru',
        location: location || '',
        budget: parseFloat(budget),
        duration: duration ? parseInt(duration) : null,
        requirements: requirements ? JSON.stringify(requirements) : null,
        status: ProjectStatus.OPEN,
        viewCount: 0,
      },
    });

    // Update owner's total projects
    await db.ownerProfile.update({
      where: { userId: ownerId },
      data: {
        totalProjects: { increment: 1 },
        activeProjects: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT - Increment view count for a project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, action } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID diperlukan' },
        { status: 400 }
      );
    }

    // If action is 'increment_view', increment the view count
    if (action === 'increment_view') {
      const project = await db.project.update({
        where: { id: projectId },
        data: {
          viewCount: { increment: 1 },
        },
        select: { id: true, viewCount: true },
      });

      return NextResponse.json({ 
        success: true, 
        viewCount: project.viewCount 
      });
    }

    return NextResponse.json(
      { error: 'Aksi tidak valid' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
