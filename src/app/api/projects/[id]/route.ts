import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const project = await db.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            owner: {
              select: {
                totalProjects: true,
              },
            },
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Proyek tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Increment view count
    await db.project.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    
    // Parse requirements from JSON string
    let requirements: string[] = [];
    if (project.requirements) {
      try {
        requirements = JSON.parse(project.requirements);
      } catch {
        requirements = [];
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category,
        location: project.location,
        budget: project.budget,
        duration: project.duration,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        requirements,
        viewCount: project.viewCount + 1,
        createdAt: project.createdAt,
        owner: project.owner,
        _count: project._count,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
