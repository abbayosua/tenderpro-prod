import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const searchSchema = z.object({
  query: z.string().optional().default(''),
  specialization: z.array(z.string()).optional().default([]),
  city: z.array(z.string()).optional().default([]),
  minRating: z.number().min(0).max(5).optional().default(0),
  minExperience: z.number().min(0).optional().default(0),
  sortBy: z.enum(['rating', 'projects', 'experience', 'newest']).optional().default('rating'),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(12),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = searchSchema.parse(body);
    const { query, specialization, city, minRating, minExperience, sortBy, page, limit } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      role: 'CONTRACTOR',
      contractor: { isNot: null },
    };

    // Text search
    if (query) {
      (where as Record<string, unknown>).OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { contractor: { companyName: { contains: query, mode: 'insensitive' } } },
        { contractor: { specialization: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Build contractor-level filters
    const contractorFilters: Record<string, unknown> = {};
    
    if (specialization.length > 0) {
      contractorFilters.specialization = { in: specialization };
    }
    
    if (city.length > 0) {
      contractorFilters.city = { in: city };
    }
    
    if (minRating > 0) {
      contractorFilters.rating = { gte: minRating };
    }
    
    if (minExperience > 0) {
      contractorFilters.experienceYears = { gte: minExperience };
    }

    // Merge contractor filters into main where
    if (Object.keys(contractorFilters).length > 0) {
      (where as Record<string, unknown>).contractor = {
        isNot: null,
        ...contractorFilters,
      };
    }

    // Build orderBy
    let orderBy: Record<string, unknown> = {};
    switch (sortBy) {
      case 'rating':
        orderBy = { contractor: { rating: 'desc' } };
        break;
      case 'projects':
        orderBy = { contractor: { totalProjects: 'desc' } };
        break;
      case 'experience':
        orderBy = { contractor: { experienceYears: 'desc' } };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get total count
    const total = await db.user.count({ where });

    // Get contractors
    const contractors = await db.user.findMany({
      where,
      include: {
        contractor: {
          include: {
            portfolios: {
              select: { id: true },
            },
            badges: {
              select: { type: true, label: true, icon: true },
              take: 5,
            },
          },
        },
        certifications: {
          select: { type: true, isVerified: true },
          take: 3,
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Get filter options
    const [specializations, cities] = await Promise.all([
      db.contractorProfile.findMany({
        where: { specialization: { not: null } },
        select: { specialization: true },
        distinct: ['specialization'],
      }),
      db.contractorProfile.findMany({
        where: { city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        contractors: contractors.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          avatar: c.avatar,
          isVerified: c.isVerified,
          company: c.contractor ? {
            name: c.contractor.companyName,
            specialization: c.contractor.specialization,
            experienceYears: c.contractor.experienceYears,
            employeeCount: c.contractor.employeeCount,
            rating: c.contractor.rating,
            totalProjects: c.contractor.totalProjects,
            completedProjects: c.contractor.completedProjects,
            city: c.contractor.city,
            province: c.contractor.province,
            description: c.contractor.description,
          } : null,
          portfolioCount: c.contractor?.portfolios.length || 0,
          badges: c.contractor?.badges || [],
          certifications: c.certifications || [],
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          specializations: specializations
            .map((s) => s.specialization)
            .filter(Boolean) as string[],
          cities: cities
            .map((c) => c.city)
            .filter(Boolean) as string[],
        },
      },
    });
  } catch (error) {
    console.error('Contractor search error:', error);

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
