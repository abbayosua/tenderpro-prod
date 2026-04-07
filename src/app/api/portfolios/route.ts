import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get portfolios for a contractor with category filter, pagination, and count summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const includeSummary = searchParams.get('summary') === 'true';

    // If userId provided, get contractor profile first
    let contractorProfileId = contractorId;
    if (!contractorId && userId) {
      const contractorProfile = await db.contractorProfile.findUnique({
        where: { userId },
      });
      if (!contractorProfile) {
        if (includeSummary) {
          return NextResponse.json({ portfolios: [], pagination: { page: 1, limit, total: 0, totalPages: 0 }, categorySummary: {} });
        }
        return NextResponse.json({ portfolios: [] });
      }
      contractorProfileId = contractorProfile.id;
    }

    if (!contractorProfileId) {
      return NextResponse.json({ error: 'Contractor ID atau User ID diperlukan' }, { status: 400 });
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { contractorId: contractorProfileId };
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await db.portfolio.count({ where: whereClause });

    // Fetch portfolios with pagination
    const portfolios = await db.portfolio.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Parse images JSON for each portfolio
    const formattedPortfolios = portfolios.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    // Build response
    const response: Record<string, unknown> = {
      portfolios: formattedPortfolios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Category count summary (if requested)
    if (includeSummary) {
      const allPortfolios = await db.portfolio.findMany({
        where: { contractorId: contractorProfileId },
        select: { category: true },
      });

      const categorySummary: Record<string, number> = {};
      for (const p of allPortfolios) {
        const cat = p.category || 'Lainnya';
        categorySummary[cat] = (categorySummary[cat] || 0) + 1;
      }

      response.categorySummary = categorySummary;
      response.totalPortfolios = total;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json({ portfolios: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  }
}

// POST - Create a new portfolio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, category, clientName, location, year, budget, images } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'User ID dan judul wajib diisi' }, { status: 400 });
    }

    // Get contractor profile
    const contractorProfile = await db.contractorProfile.findUnique({
      where: { userId },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Profil kontraktor tidak ditemukan' }, { status: 404 });
    }

    const portfolio = await db.portfolio.create({
      data: {
        contractorId: contractorProfile.id,
        title,
        description: description || '',
        category: category || 'Lainnya',
        clientName,
        location,
        year: year || new Date().getFullYear(),
        budget: budget ? parseFloat(String(budget)) : null,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
      },
    });

    // Update contractor's total projects count
    await db.contractorProfile.update({
      where: { id: contractorProfile.id },
      data: { totalProjects: { increment: 1 } },
    });

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json({ error: 'Gagal membuat portofolio' }, { status: 500 });
  }
}

// PUT - Update a portfolio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, userId, title, description, category, clientName, location, year, budget, images } = body;

    if (!portfolioId || !userId) {
      return NextResponse.json({ error: 'Portfolio ID dan User ID wajib diisi' }, { status: 400 });
    }

    // Verify ownership
    const contractorProfile = await db.contractorProfile.findUnique({
      where: { userId },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Profil kontraktor tidak ditemukan' }, { status: 404 });
    }

    const existingPortfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!existingPortfolio || existingPortfolio.contractorId !== contractorProfile.id) {
      return NextResponse.json({ error: 'Portofolio tidak ditemukan atau akses ditolak' }, { status: 403 });
    }

    const portfolio = await db.portfolio.update({
      where: { id: portfolioId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(clientName !== undefined && { clientName }),
        ...(location !== undefined && { location }),
        ...(year !== undefined && { year: year ? parseInt(String(year)) : undefined }),
        ...(budget !== undefined && { budget: budget ? parseFloat(String(budget)) : null }),
        ...(images !== undefined && { images: images && images.length > 0 ? JSON.stringify(images) : null }),
      },
    });

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json({ error: 'Gagal mengupdate portofolio' }, { status: 500 });
  }
}

// DELETE - Delete a portfolio
export async function DELETE(request: NextRequest) {
  try {
    const portfolioId = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!portfolioId || !userId) {
      return NextResponse.json({ error: 'Portfolio ID dan User ID wajib diisi' }, { status: 400 });
    }

    // Verify ownership
    const contractorProfile = await db.contractorProfile.findUnique({
      where: { userId },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Profil kontraktor tidak ditemukan' }, { status: 404 });
    }

    const existingPortfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!existingPortfolio || existingPortfolio.contractorId !== contractorProfile.id) {
      return NextResponse.json({ error: 'Portofolio tidak ditemukan atau akses ditolak' }, { status: 403 });
    }

    await db.portfolio.delete({
      where: { id: portfolioId },
    });

    // Update contractor's total projects count
    await db.contractorProfile.update({
      where: { id: contractorProfile.id },
      data: { totalProjects: { decrement: 1 } },
    });

    return NextResponse.json({ success: true, message: 'Portofolio berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json({ error: 'Gagal menghapus portofolio' }, { status: 500 });
  }
}
