import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List project team members
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID diperlukan' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if ProjectMember model exists
    if (!db.projectMember) {
      return NextResponse.json({ success: true, members: [], total: 0 });
    }

    const members = await db.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            role: true,
            isVerified: true,
            contractor: {
              select: {
                companyName: true,
                specialization: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // Group by role
    const roleGroups: Record<string, typeof members> = {};
    for (const member of members) {
      const role = member.role;
      if (!roleGroups[role]) roleGroups[role] = [];
      roleGroups[role].push(member);
    }

    return NextResponse.json({
      success: true,
      members,
      total: members.length,
      roleGroups,
    });
  } catch (error) {
    console.error('Error fetching project members:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat anggota proyek' },
      { status: 500 }
    );
  }
}

// POST - Add member to project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, role } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Project ID dan User ID diperlukan' },
        { status: 400 }
      );
    }

    const validRoles = ['PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'MEMBER'];
    const memberRole = role || 'MEMBER';

    if (!validRoles.includes(memberRole)) {
      return NextResponse.json(
        { success: false, error: `Peran tidak valid. Peran yang tersedia: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if ProjectMember model exists
    if (!db.projectMember) {
      return NextResponse.json(
        { success: false, error: 'Fitur anggota proyek belum tersedia' },
        { status: 503 }
      );
    }

    // Check project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan' },
        { status: 404 }
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

    // Check if already a member
    const existingMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (existingMember) {
      // Update role instead
      const updated = await db.projectMember.update({
        where: { id: existingMember.id },
        data: { role: memberRole },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              contractor: {
                select: {
                  companyName: true,
                  specialization: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Peran anggota berhasil diperbarui',
        member: updated,
      });
    }

    // Add member
    const member = await db.projectMember.create({
      data: {
        projectId,
        userId,
        role: memberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            role: true,
            isVerified: true,
            contractor: {
              select: {
                companyName: true,
                specialization: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil ditambahkan ke proyek',
      member,
    });
  } catch (error) {
    console.error('Error adding project member:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan anggota proyek' },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from project
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Member ID diperlukan' },
        { status: 400 }
      );
    }

    if (!db.projectMember) {
      return NextResponse.json(
        { success: false, error: 'Fitur anggota proyek belum tersedia' },
        { status: 503 }
      );
    }

    // Check member exists
    const member = await db.projectMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Anggota proyek tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.projectMember.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil dihapus dari proyek',
    });
  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus anggota proyek' },
      { status: 500 }
    );
  }
}
