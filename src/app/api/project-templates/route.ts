import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List project templates
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const isPublic = request.nextUrl.searchParams.get('public') === 'true';
    const category = request.nextUrl.searchParams.get('category');

    // Check if ProjectTemplate model exists
    if (!db.projectTemplate) {
      return NextResponse.json({ success: true, templates: [], total: 0 });
    }

    const where: Record<string, unknown> = {};

    if (isPublic) {
      where.isPublic = true;
    } else if (userId) {
      where.userId = userId;
    } else {
      return NextResponse.json(
        { success: false, error: 'User ID atau parameter public diperlukan' },
        { status: 400 }
      );
    }

    if (category) {
      where.category = category;
    }

    const templates = await db.projectTemplate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            contractor: {
              select: {
                companyName: true,
                rating: true,
                completedProjects: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get distinct categories for filter options
    const categories = await db.projectTemplate.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error('Error fetching project templates:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat template proyek' },
      { status: 500 }
    );
  }
}

// POST - Create a project template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      category,
      requirements,
      budgetRange,
      durationRange,
      isPublic,
    } = body;

    if (!userId || !title || !description || !category) {
      return NextResponse.json(
        { success: false, error: 'User ID, judul, deskripsi, dan kategori diperlukan' },
        { status: 400 }
      );
    }

    if (!db.projectTemplate) {
      return NextResponse.json(
        { success: false, error: 'Fitur template proyek belum tersedia' },
        { status: 503 }
      );
    }

    // Check user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const template = await db.projectTemplate.create({
      data: {
        userId,
        title,
        description,
        category,
        requirements: requirements || null,
        budgetRange: budgetRange || null,
        durationRange: durationRange || null,
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template proyek berhasil dibuat',
      template,
    });
  } catch (error) {
    console.error('Error creating project template:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat template proyek' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project template
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID diperlukan' },
        { status: 400 }
      );
    }

    if (!db.projectTemplate) {
      return NextResponse.json(
        { success: false, error: 'Fitur template proyek belum tersedia' },
        { status: 503 }
      );
    }

    // Check template exists
    const existing = await db.projectTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Template proyek tidak ditemukan' },
        { status: 404 }
      );
    }

    // Only allow deletion by owner or admin
    if (userId && existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki izin untuk menghapus template ini' },
        { status: 403 }
      );
    }

    await db.projectTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template proyek berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting project template:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus template proyek' },
      { status: 500 }
    );
  }
}
