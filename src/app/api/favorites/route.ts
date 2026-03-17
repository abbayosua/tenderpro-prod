import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get user's favorite contractors
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if favorite model exists
    if (!db.favorite) {
      return NextResponse.json({ favorites: [] });
    }

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        contractor: {
          include: {
            contractor: {
              include: {
                portfolios: {
                  take: 3,
                  orderBy: { createdAt: 'desc' }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedFavorites = favorites.map(fav => ({
      id: fav.id,
      notes: fav.notes,
      createdAt: fav.createdAt,
      contractor: {
        id: fav.contractor.id,
        name: fav.contractor.name,
        email: fav.contractor.email,
        isVerified: fav.contractor.isVerified,
        verificationStatus: fav.contractor.verificationStatus,
        company: fav.contractor.contractor ? {
          name: fav.contractor.contractor.companyName,
          specialization: fav.contractor.contractor.specialization,
          experienceYears: fav.contractor.contractor.experienceYears,
          rating: fav.contractor.contractor.rating,
          totalProjects: fav.contractor.contractor.totalProjects,
          completedProjects: fav.contractor.contractor.completedProjects,
          city: fav.contractor.contractor.city,
        } : null,
        portfolios: fav.contractor.contractor?.portfolios || []
      }
    }));

    return NextResponse.json({ favorites: formattedFavorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ favorites: [] });
  }
}

// POST - Add a contractor to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contractorId, notes } = body;

    if (!userId || !contractorId) {
      return NextResponse.json({ error: 'User ID and Contractor ID required' }, { status: 400 });
    }

    // Check if favorite model exists
    if (!db.favorite) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    // Check if already favorited
    const existing = await db.favorite.findUnique({
      where: {
        userId_contractorId: { userId, contractorId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Contractor already in favorites' }, { status: 400 });
    }

    const favorite = await db.favorite.create({
      data: {
        userId,
        contractorId,
        notes
      }
    });

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE - Remove a contractor from favorites
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const contractorId = request.nextUrl.searchParams.get('contractorId');
    const favoriteId = request.nextUrl.searchParams.get('id');

    // Check if favorite model exists
    if (!db.favorite) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 503 });
    }

    if (favoriteId) {
      await db.favorite.delete({
        where: { id: favoriteId }
      });
    } else if (userId && contractorId) {
      await db.favorite.delete({
        where: {
          userId_contractorId: { userId, contractorId }
        }
      });
    } else {
      return NextResponse.json({ error: 'Favorite ID or User ID + Contractor ID required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
