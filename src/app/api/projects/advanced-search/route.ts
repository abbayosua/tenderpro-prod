import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma, ProjectStatus } from '@prisma/client';
import { z } from 'zod';

// ─── Zod Schema for Advanced Search ─────────────────────────────────────────

const advancedSearchSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  location: z.string().optional(),
  province: z.string().optional(),
  statuses: z.array(z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  ownerVerified: z.boolean().optional(),
  sortBy: z.enum(['newest', 'budget_high', 'budget_low', 'most_bids']).default('newest'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
});

// ─── POST — Advanced project search ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const parsed = advancedSearchSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const {
      query,
      categories,
      budgetMin,
      budgetMax,
      location,
      province,
      statuses,
      createdAfter,
      createdBefore,
      ownerVerified,
      sortBy,
      page,
      limit,
    } = parsed.data;

    // ── Build WHERE clause ──────────────────────────────────────────────────
    const where: Prisma.ProjectWhereInput = {};

    // Status filter — default to OPEN if no statuses specified
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses as ProjectStatus[] };
    } else {
      where.status = ProjectStatus.OPEN;
    }

    // Text search across title and description
    if (query && query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    // Category multi-select
    if (categories && categories.length > 0) {
      where.category = { in: categories };
    }

    // Budget range
    if (budgetMin !== undefined || budgetMax !== undefined) {
      where.budget = {};
      if (budgetMin !== undefined) (where.budget as any).gte = budgetMin;
      if (budgetMax !== undefined) (where.budget as any).lte = budgetMax;
    }

    // Location / Province filter
    if (location && location.trim()) {
      where.location = { contains: location.trim(), mode: 'insensitive' };
    }
    if (province && province.trim()) {
      where.location = { ...((where.location as any) || {}), contains: province.trim(), mode: 'insensitive' };
    }

    // Date range
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) (where.createdAt as any).gte = new Date(createdAfter);
      if (createdBefore) (where.createdAt as any).lte = new Date(createdBefore);
    }

    // Owner verification filter
    if (ownerVerified === true) {
      where.owner = { isVerified: true };
    }

    // ── Build ORDER BY ──────────────────────────────────────────────────────
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

    // ── Pagination ──────────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const take = limit;

    // ── Query ───────────────────────────────────────────────────────────────
    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          owner: {
            include: { owner: true },
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

    const totalPages = Math.ceil(total / take);

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

    // ── Build applied filters summary ───────────────────────────────────────
    const appliedFilters: Record<string, string | string[]> = {};
    if (query?.trim()) appliedFilters.query = query.trim();
    if (categories?.length) appliedFilters.kategori = categories;
    if (budgetMin !== undefined) appliedFilters.anggaranMin = `Rp ${budgetMin.toLocaleString('id-ID')}`;
    if (budgetMax !== undefined) appliedFilters.anggaranMax = `Rp ${budgetMax.toLocaleString('id-ID')}`;
    if (location?.trim()) appliedFilters.lokasi = location.trim();
    if (province?.trim()) appliedFilters.provinsi = province.trim();
    if (statuses?.length) appliedFilters.status = statuses;
    if (createdAfter) appliedFilters.dibuatSetelah = new Date(createdAfter).toLocaleDateString('id-ID');
    if (createdBefore) appliedFilters.dibuatSebelum = new Date(createdBefore).toLocaleDateString('id-ID');
    if (ownerVerified) appliedFilters.pemilikTerverifikasi = 'Ya';

    return NextResponse.json({
      success: true,
      data: {
        projects: formattedProjects,
        pagination: {
          page,
          limit: take,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        appliedFilters,
      },
    });
  } catch (error) {
    console.error('Advanced project search error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencari proyek' },
      { status: 500 },
    );
  }
}

// ─── GET — Get available filter options (categories, locations) ──────────────

export async function GET() {
  try {
    const [categories, locations] = await Promise.all([
      // Distinct categories from open projects
      db.project.groupBy({
        by: ['category'],
        where: { status: ProjectStatus.OPEN },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      // Distinct locations from open projects
      db.project.groupBy({
        by: ['location'],
        where: { status: ProjectStatus.OPEN },
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
        take: 30,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        categories: categories.map((c) => ({
          value: c.category,
          count: c._count.category,
        })),
        locations: locations.map((l) => ({
          value: l.location,
          count: l._count.location,
        })),
        sortOptions: [
          { value: 'newest', label: 'Terbaru' },
          { value: 'budget_high', label: 'Anggaran Tertinggi' },
          { value: 'budget_low', label: 'Anggaran Terendah' },
          { value: 'most_bids', label: 'Paling Banyak Bid' },
        ],
        statusOptions: [
          { value: 'OPEN', label: 'Tender Terbuka' },
          { value: 'IN_PROGRESS', label: 'Sedang Berjalan' },
          { value: 'COMPLETED', label: 'Selesai' },
          { value: 'DRAFT', label: 'Draf' },
          { value: 'CANCELLED', label: 'Dibatalkan' },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat opsi filter' },
      { status: 500 },
    );
  }
}
