import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Query validation schema
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  minBudget: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxBudget: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'budget', 'viewCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      location: searchParams.get('location') || undefined,
      minBudget: searchParams.get('minBudget') || undefined,
      maxBudget: searchParams.get('maxBudget') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });
    
    const { page, limit, status, category, location, minBudget, maxBudget, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Record<string, unknown> = {
      // Only show OPEN projects for public listing (contractors can see open projects)
      status: status || 'OPEN',
    };
    
    if (category) {
      where.category = category;
    }
    
    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }
    
    if (minBudget !== undefined || maxBudget !== undefined) {
      where.budget = {};
      if (minBudget !== undefined) {
        (where.budget as Record<string, unknown>).gte = minBudget;
      }
      if (maxBudget !== undefined) {
        (where.budget as Record<string, unknown>).lte = maxBudget;
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Build orderBy
    const orderBy: Record<string, unknown> = {};
    orderBy[sortBy] = sortOrder;
    
    // Get total count
    const total = await db.project.count({ where });
    
    // Get projects
    const projects = await db.project.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    });
    
    // Get unique categories for filter
    const categories = await db.project.groupBy({
      by: ['category'],
      where: { status: 'OPEN' },
      _count: true,
    });
    
    // Get unique locations for filter
    const locations = await db.project.findMany({
      where: { status: 'OPEN' },
      select: { location: true },
      distinct: ['location'],
    });
    
    return NextResponse.json({
      success: true,
      data: {
        projects: projects.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description.substring(0, 200) + (p.description.length > 200 ? '...' : ''),
          category: p.category,
          location: p.location,
          budget: p.budget,
          duration: p.duration,
          status: p.status,
          viewCount: p.viewCount,
          bidCount: p._count.bids,
          createdAt: p.createdAt,
          owner: p.owner,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          categories: categories.map(c => ({ name: c.category, count: c._count })),
          locations: locations.map(l => l.location),
        },
      },
    });
  } catch (error) {
    console.error('Public projects API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Parameter tidak valid', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
