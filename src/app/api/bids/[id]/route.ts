import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BidStatus } from '@prisma/client';

// GET - Get bid details with contractor profile info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bid = await db.bid.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                isVerified: true,
                owner: {
                  select: {
                    companyName: true,
                    totalProjects: true,
                  },
                },
              },
            },
            milestones: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
        contractor: {
          include: {
            contractor: {
              include: {
                portfolios: {
                  take: 3,
                  orderBy: { createdAt: 'desc' },
                },
                certifications: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json(
        { success: false, error: 'Penawaran tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get other bids on the same project for comparison
    const otherBids = await db.bid.findMany({
      where: {
        projectId: bid.projectId,
        id: { not: bid.id },
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      select: {
        id: true,
        price: true,
        duration: true,
        status: true,
        createdAt: true,
        contractor: {
          select: {
            id: true,
            name: true,
            contractor: {
              select: { rating: true, companyName: true },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    // Calculate bid rank by price
    const allBidsByPrice = await db.bid.findMany({
      where: { projectId: bid.projectId, status: { in: ['PENDING', 'ACCEPTED', 'REJECTED'] } },
      select: { id: true, price: true },
      orderBy: { price: 'asc' },
    });
    const priceRank = allBidsByPrice.findIndex((b) => b.id === bid.id) + 1;

    return NextResponse.json({
      success: true,
      data: {
        id: bid.id,
        proposal: bid.proposal,
        price: bid.price,
        duration: bid.duration,
        startDate: bid.startDate,
        status: bid.status,
        notes: bid.notes,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
        priceRank: priceRank > 0 ? priceRank : null,
        totalBids: allBidsByPrice.length,
        project: {
          id: bid.project.id,
          title: bid.project.title,
          description: bid.project.description,
          category: bid.project.category,
          location: bid.project.location,
          budget: bid.project.budget,
          status: bid.project.status,
          owner: bid.project.owner,
          milestonesCount: bid.project.milestones.length,
          completedMilestones: bid.project.milestones.filter((m) => m.status === 'COMPLETED').length,
        },
        contractor: {
          id: bid.contractor.id,
          name: bid.contractor.name,
          email: bid.contractor.email,
          phone: bid.contractor.phone,
          avatar: bid.contractor.avatar,
          isVerified: bid.contractor.isVerified,
          verificationStatus: bid.contractor.verificationStatus,
          createdAt: bid.contractor.createdAt,
          company: bid.contractor.contractor
            ? {
                id: bid.contractor.contractor.id,
                name: bid.contractor.contractor.companyName,
                type: bid.contractor.contractor.companyType,
                specialization: bid.contractor.contractor.specialization,
                experienceYears: bid.contractor.contractor.experienceYears,
                employeeCount: bid.contractor.contractor.employeeCount,
                rating: bid.contractor.contractor.rating,
                totalProjects: bid.contractor.contractor.totalProjects,
                completedProjects: bid.contractor.contractor.completedProjects,
                city: bid.contractor.contractor.city,
                province: bid.contractor.contractor.province,
                description: bid.contractor.contractor.description,
              }
            : null,
          portfolios: bid.contractor.contractor?.portfolios || [],
          certifications: bid.contractor.contractor?.certifications || [],
        },
        otherBids,
      },
    });
  } catch (error) {
    console.error('Gagal memuat detail penawaran:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat detail penawaran' },
      { status: 500 }
    );
  }
}

// PUT - Update bid status (ACCEPTED/REJECTED/WITHDRAWN)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason, userId } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status baru diperlukan' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    const validStatuses: string[] = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid: ${status}. Gunakan endpoint /api/bids untuk status lainnya` },
        { status: 400 }
      );
    }

    // Fetch bid with project and contractor info
    const bid = await db.bid.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
            bids: {
              include: {
                contractor: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        contractor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!bid) {
      return NextResponse.json(
        { success: false, error: 'Penawaran tidak ditemukan' },
        { status: 404 }
      );
    }

    const statusLabels: Record<string, string> = {
      PENDING: 'Menunggu',
      ACCEPTED: 'Diterima',
      REJECTED: 'Ditolak',
      WITHDRAWN: 'Ditarik',
    };

    // Validate status-specific rules
    if (status === 'ACCEPTED') {
      // Only project owner can accept
      if (userId !== bid.project.ownerId) {
        return NextResponse.json(
          { success: false, error: 'Hanya pemilik proyek yang dapat menerima penawaran' },
          { status: 403 }
        );
      }

      // Only PENDING bids can be accepted
      if (bid.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: `Hanya penawaran dengan status PENDING yang dapat diterima. Status saat ini: ${statusLabels[bid.status] || bid.status}` },
          { status: 400 }
        );
      }

      // Check if there's already an accepted bid
      const existingAccepted = bid.project.bids.find((b) => b.status === 'ACCEPTED');
      if (existingAccepted) {
        return NextResponse.json(
          {
            success: false,
            error: `Proyek ini sudah memiliki penawaran yang diterima dari ${existingAccepted.contractor.name}. Batalkan terlebih dahulu sebelum menerima penawaran baru.`,
          },
          { status: 400 }
        );
      }
    }

    if (status === 'REJECTED') {
      // Only project owner can reject
      if (userId !== bid.project.ownerId) {
        return NextResponse.json(
          { success: false, error: 'Hanya pemilik proyek yang dapat menolak penawaran' },
          { status: 403 }
        );
      }

      // Only PENDING bids can be rejected
      if (bid.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: `Hanya penawaran dengan status PENDING yang dapat ditolak. Status saat ini: ${statusLabels[bid.status] || bid.status}` },
          { status: 400 }
        );
      }
    }

    if (status === 'WITHDRAWN') {
      // Only the contractor can withdraw their own bid
      if (userId !== bid.contractorId) {
        return NextResponse.json(
          { success: false, error: 'Hanya kontraktor yang dapat menarik penawaran mereka sendiri' },
          { status: 403 }
        );
      }

      // Only PENDING bids can be withdrawn
      if (bid.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: `Hanya penawaran dengan status PENDING yang dapat ditarik. Status saat ini: ${statusLabels[bid.status] || bid.status}` },
          { status: 400 }
        );
      }
    }

    // Update bid status
    const updatedBid = await db.bid.update({
      where: { id },
      data: {
        status: status as BidStatus,
        notes: reason || bid.notes,
        updatedAt: new Date(),
      },
    });

    // Side effects for ACCEPTED
    if (status === 'ACCEPTED') {
      // Reject all other PENDING bids on the same project
      const otherPendingBids = bid.project.bids.filter(
        (b) => b.id !== id && b.status === 'PENDING'
      );

      if (otherPendingBids.length > 0) {
        await db.bid.updateMany({
          where: {
            id: { in: otherPendingBids.map((b) => b.id) },
          },
          data: {
            status: 'REJECTED',
            notes: 'Otomatis ditolak karena penawaran lain telah diterima',
            updatedAt: new Date(),
          },
        });

        // Notify rejected contractors
        try {
          if (db.notification) {
            const rejectedNotifications = otherPendingBids.map((b) => ({
              userId: b.contractor.id,
              title: 'Penawaran Ditolak',
              message: `Penawaran Anda untuk proyek "${bid.project.title}" ditolak secara otomatis karena pemilik proyek telah menerima penawaran lain.`,
              type: 'BID_REJECTED',
              relatedId: b.projectId,
            }));
            await db.notification.createMany({ data: rejectedNotifications });
          }
        } catch {
          // Non-critical
        }
      }

      // Update project status to IN_PROGRESS
      await db.project.update({
        where: { id: bid.projectId },
        data: { status: 'IN_PROGRESS' },
      });

      // Update contractor stats
      await db.contractorProfile.upsert({
        where: { userId: bid.contractorId },
        create: {
          userId: bid.contractorId,
          totalProjects: { increment: 0 },
        },
        update: {
          totalProjects: { increment: 1 },
        },
      });
    }

    // Create activity log
    const actionDescriptions: Record<string, string> = {
      ACCEPTED: `Penawaran dari ${bid.contractor.name} untuk proyek "${bid.project.title}" diterima`,
      REJECTED: `Penawaran dari ${bid.contractor.name} untuk proyek "${bid.project.title}" ditolak${reason ? `. Alasan: ${reason}` : ''}`,
      WITHDRAWN: `${bid.contractor.name} menarik penawaran untuk proyek "${bid.project.title}"${reason ? `. Alasan: ${reason}` : ''}`,
    };

    try {
      if (db.activityLog) {
        await db.activityLog.create({
          data: {
            projectId: bid.projectId,
            userId,
            action: `BID_${status}`,
            description: actionDescriptions[status] || `Status penawaran diubah menjadi ${status}`,
            metadata: JSON.stringify({
              bidId: id,
              previousStatus: bid.status,
              newStatus: status,
              contractorName: bid.contractor.name,
              projectName: bid.project.title,
              reason: reason || null,
              autoRejectedCount: status === 'ACCEPTED' ? (bid.project.bids.filter((b) => b.id !== id && b.status === 'PENDING').length) : 0,
            }),
          },
        });
      }
    } catch {
      // Activity log is non-critical
    }

    // Send notification to the contractor for ACCEPTED/REJECTED
    if (status === 'ACCEPTED' || status === 'REJECTED') {
      try {
        if (db.notification) {
          await db.notification.create({
            data: {
              userId: bid.contractor.id,
              title: status === 'ACCEPTED' ? 'Penawaran Diterima! 🎉' : 'Penawaran Ditolak',
              message: `Penawaran Anda untuk proyek "${bid.project.title}" telah ${statusLabels[status].toLowerCase()}${reason ? `. ${reason}` : ''}`,
              type: status === 'ACCEPTED' ? 'BID_ACCEPTED' : 'BID_REJECTED',
              relatedId: bid.projectId,
            },
          });
        }
      } catch {
        // Non-critical
      }
    }

    // Notify owner when contractor withdraws
    if (status === 'WITHDRAWN') {
      try {
        if (db.notification) {
          await db.notification.create({
            data: {
              userId: bid.project.ownerId,
              title: 'Penawaran Ditarik',
              message: `${bid.contractor.name} telah menarik penawaran untuk proyek "${bid.project.title}"`,
              type: 'BID_WITHDRAWN',
              relatedId: bid.projectId,
            },
          });
        }
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      success: true,
      message: actionDescriptions[status],
      data: {
        id: updatedBid.id,
        status: updatedBid.status,
        notes: updatedBid.notes,
        updatedAt: updatedBid.updatedAt,
        previousStatus: bid.status,
        projectStatus: status === 'ACCEPTED' ? 'IN_PROGRESS' : bid.project.status,
        autoRejectedCount: status === 'ACCEPTED'
          ? bid.project.bids.filter((b) => b.id !== id && b.status === 'PENDING').length
          : 0,
      },
    });
  } catch (error) {
    console.error('Gagal memperbarui status penawaran:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memperbarui status penawaran' },
      { status: 500 }
    );
  }
}
