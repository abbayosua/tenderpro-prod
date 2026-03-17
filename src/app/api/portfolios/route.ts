import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get portfolios for a contractor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const userId = searchParams.get('userId');

    // If userId provided, get contractor profile first
    let contractorProfileId = contractorId;
    if (!contractorId && userId) {
      const contractorProfile = await db.contractorProfile.findUnique({
        where: { userId },
      });
      if (!contractorProfile) {
        return NextResponse.json({ portfolios: [] });
      }
      contractorProfileId = contractorProfile.id;
    }

    if (!contractorProfileId) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 });
    }

    const portfolios = await db.portfolio.findMany({
      where: { contractorId: contractorProfileId },
      orderBy: { createdAt: 'desc' },
    });

    // Parse images JSON for each portfolio
    const formattedPortfolios = portfolios.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    return NextResponse.json({ portfolios: formattedPortfolios });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json({ portfolios: [] });
  }
}

// POST - Create a new portfolio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, category, clientName, location, year, budget, images } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'User ID and title are required' }, { status: 400 });
    }

    // Get contractor profile
    const contractorProfile = await db.contractorProfile.findUnique({
      where: { userId },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const portfolio = await db.portfolio.create({
      data: {
        contractorId: contractorProfile.id,
        title,
        description: description || '',
        category: category || 'Umum',
        clientName,
        location,
        year: year || new Date().getFullYear(),
        budget: budget ? parseFloat(budget) : null,
        images: images ? JSON.stringify(images) : null,
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
    return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
  }
}

// PUT - Update a portfolio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, userId, title, description, category, clientName, location, year, budget, images } = body;

    if (!portfolioId || !userId) {
      return NextResponse.json({ error: 'Portfolio ID and User ID are required' }, { status: 400 });
    }

    // Verify ownership
    const contractorProfile = await db.contractorProfile.findUnique({
      where: { userId },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const existingPortfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!existingPortfolio || existingPortfolio.contractorId !== contractorProfile.id) {
      return NextResponse.json({ error: 'Portfolio not found or access denied' }, { status: 403 });
    }

    const portfolio = await db.portfolio.update({
      where: { id: portfolioId },
      data: {
        title,
        description,
        category,
        clientName,
        location,
        year: year ? parseInt(year) : undefined,
        budget: budget ? parseFloat(budget) : null,
        images: images ? JSON.stringify(images) : null,
      },
    });

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
  }
}

// DELETE - Delete a portfolio
export async function DELETE(request: NextRequest) {
  try {
    const portfolioId = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!portfolioId || !userId) {
      return NextResponse.json({ error: 'Portfolio ID and User ID are required' }, { status: 400 });
    }

    // Verify ownership
    const contractorProfile = await db.contractorProfile.findUnique({
      where: { userId },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const existingPortfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!existingPortfolio || existingPortfolio.contractorId !== contractorProfile.id) {
      return NextResponse.json({ error: 'Portfolio not found or access denied' }, { status: 403 });
    }

    await db.portfolio.delete({
      where: { id: portfolioId },
    });

    // Update contractor's total projects count
    await db.contractorProfile.update({
      where: { id: contractorProfile.id },
      data: { totalProjects: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 });
  }
}
