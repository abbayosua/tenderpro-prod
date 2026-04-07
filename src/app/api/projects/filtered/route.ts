import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Server-side filtering and sorting of projects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      status,
      category,
      location,
      budgetMin,
      budgetMax,
      sortBy = 'newest',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      ownerId,
    } = body;

    // Validate inputs
    const pageNum = Math.max(1, Math.min(100, parseInt(String(page)) || 1));
    const limitNum = Math.max(1, Math.min(50, parseInt(String(limit)) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Check if Project model exists
    if (!db.project) {
      return NextResponse.json({
        success: true,
        projects: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
      });
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (location && location.trim()) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (budgetMin !== undefined && budgetMin !== null && !isNaN(Number(budgetMin))) {
      where.budget = { ...(where.budget as Record<string, unknown> || {}), gte: Number(budgetMin) };
    }

    if (budgetMax !== undefined && budgetMax !== null && !isNaN(Number(budgetMax))) {
      where.budget = { ...(where.budget as Record<string, unknown> || {}), lte: Number(budgetMax) };
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Build orderBy
    let orderBy: Record<string, unknown> = { createdAt: 'desc' };
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
        break;
      case 'budget_high':
        orderBy = { budget: 'desc' };
        break;
      case 'budget_low':
        orderBy = { budget: 'asc' };
        break;
      case 'most_bids':
        orderBy = { bids: { _count: sortOrder === 'asc' ? 'asc' : 'desc' } };
        break;
      case 'deadline':
        orderBy = { endDate: sortOrder === 'asc' ? 'asc' : 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: { bids: true },
          },
          bids: {
            where: { status: 'PENDING' },
            take: 1,
            include: {
              contractor: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      db.project.count({ where }),
    ]);

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      location: p.location,
      budget: p.budget,
      status: p.status,
      duration: p.duration,
      startDate: p.startDate,
      endDate: p.endDate,
      viewCount: p.viewCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      owner: {
        id: p.owner.id,
        name: p.owner.name,
        avatar: p.owner.avatar,
      },
      bidCount: p._count.bids,
      bids: p.bids.map((b) => ({
        id: b.id,
        price: b.price,
        duration: b.duration,
        status: b.status,
        proposal: b.proposal,
        contractor: {
          id: b.contractor.id,
          name: b.contractor.name,
          company: b.contractor.company,
        },
      })),
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error filtering projects:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
