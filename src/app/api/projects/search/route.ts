import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectStatus, Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      categories,
      locations,
      budgetMin,
      budgetMax,
      durationMax,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = body;

    // Build the WHERE clause
    const where: Prisma.ProjectWhereInput = {
      status: ProjectStatus.OPEN,
    };

    // Text search on title, description, and location
    if (query && query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
        { location: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (categories && Array.isArray(categories) && categories.length > 0) {
      where.category = { in: categories };
    }

    // Location filter
    if (locations && Array.isArray(locations) && locations.length > 0) {
      where.location = { in: locations };
    }

    // Budget range filter
    if (budgetMin !== undefined && budgetMin !== null) {
      where.budget = { ...(where.budget as any || {}), gte: parseFloat(budgetMin) };
    }
    if (budgetMax !== undefined && budgetMax !== null) {
      where.budget = { ...(where.budget as any || {}), lte: parseFloat(budgetMax) };
    }

    // Duration filter
    if (durationMax !== undefined && durationMax !== null) {
      where.duration = { lte: parseInt(durationMax) };
    }

    // Build ORDER BY clause
    let orderBy: Prisma.ProjectOrderByWithRelationInput;
    switch (sortBy) {
      case 'budget_high':
        orderBy = { budget: 'desc' };
        break;
      case 'budget_low':
        orderBy = { budget: 'asc' };
        break;
      case 'most_bids':
        orderBy = { bids: { _count: 'desc' } };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Pagination
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const take = parseInt(String(limit));

    // Fetch projects with bid count and owner info
    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          owner: {
            include: {
              owner: true,
            },
          },
          _count: {
            select: { bids: true },
          },
        },
        orderBy,
        skip,
        take,
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
        isVerified: p.owner.isVerified,
        company: p.owner.owner?.companyName,
      },
      bidCount: p._count.bids,
    }));

    const totalPages = Math.ceil(total / take);

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      pagination: {
        page: parseInt(String(page)),
        limit: take,
        total,
        totalPages,
        hasNext: parseInt(String(page)) < totalPages,
        hasPrev: parseInt(String(page)) > 1,
      },
    });
  } catch (error) {
    console.error('Project search error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencari proyek' },
      { status: 500 }
    );
  }
}
