import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get activity feed by projectId or userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!projectId && !userId) {
      return NextResponse.json(
        { error: 'Project ID atau User ID diperlukan' },
        { status: 400 }
      );
    }

    // Check if activityLog model exists
    if (!db.activityLog) {
      return NextResponse.json({ activities: [], total: 0, pagination: { page, limit, totalPages: 0 } });
    }

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;

    const [activities, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isVerified: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
        createdAt: a.createdAt,
        user: a.user,
        project: a.project,
      })),
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create an activity log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, action, description, metadata } = body;

    if (!userId || !action || !description) {
      return NextResponse.json(
        { error: 'User ID, action, dan description diperlukan' },
        { status: 400 }
      );
    }

    if (!db.activityLog) {
      return NextResponse.json({ error: 'Fitur belum tersedia' }, { status: 503 });
    }

    const activity = await db.activityLog.create({
      data: {
        projectId: projectId || null,
        userId,
        action,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Gagal membuat aktivitas' },
      { status: 500 }
    );
  }
}
