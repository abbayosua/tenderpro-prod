import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Activity type definitions
const ACTIVITY_TYPES = {
  BID_SUBMITTED: { icon: 'FileText', label: 'Penawaran Diajukan' },
  BID_ACCEPTED: { icon: 'CheckCircle', label: 'Penawaran Diterima' },
  BID_REJECTED: { icon: 'XCircle', label: 'Penawaran Ditolak' },
  REVIEW_GIVEN: { icon: 'Star', label: 'Review Diberikan' },
  PROJECT_CREATED: { icon: 'Plus', label: 'Proyek Dibuat' },
  MILESTONE_COMPLETED: { icon: 'Flag', label: 'Milestone Selesai' },
  CERTIFICATION_ADDED: { icon: 'Award', label: 'Sertifikasi Ditambahkan' },
} as const;

type ActivityType = keyof typeof ACTIVITY_TYPES;

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  relatedEntity: {
    type: string;
    id: string;
    title?: string;
  };
  icon: string;
  iconLabel: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!userId) {
      return NextResponse.json({ error: 'Parameter userId wajib diisi' }, { status: 400 });
    }

    const activities: ActivityItem[] = [];
    let totalCount = 0;

    // Fetch user info for context
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });

    const isContractor = user?.role === 'CONTRACTOR';
    const isOwner = user?.role === 'OWNER';

    // ============================================================
    // Source 1: Bids (penawaran)
    // ============================================================
    const bidWhere = isContractor
      ? { contractorId: userId }
      : { project: { ownerId: userId } };

    const bids = await db.bid.findMany({
      where: bidWhere,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        project: { select: { id: true, title: true } },
        contractor: { select: { id: true, name: true } },
      },
    });

    const bidTotalCount = await db.bid.count({ where: bidWhere });

    for (const bid of bids) {
      let activityType: ActivityType;
      let description: string;

      if (isContractor) {
        activityType = bid.status === 'ACCEPTED' ? 'BID_ACCEPTED'
          : bid.status === 'REJECTED' ? 'BID_REJECTED'
          : 'BID_SUBMITTED';
        description = bid.status === 'ACCEPTED'
          ? `Penawaran Anda untuk "${bid.project.title}" diterima`
          : bid.status === 'REJECTED'
          ? `Penawaran Anda untuk "${bid.project.title}" ditolak`
          : `Anda mengajukan penawaran untuk "${bid.project.title}"`;
      } else {
        activityType = 'BID_SUBMITTED';
        description = `${bid.contractor.name} mengajukan penawaran untuk "${bid.project.title}"`;
      }

      activities.push({
        id: `bid-${bid.id}`,
        type: activityType,
        description,
        timestamp: bid.createdAt,
        relatedEntity: {
          type: 'bid',
          id: bid.id,
          title: bid.project.title,
        },
        icon: ACTIVITY_TYPES[activityType].icon,
        iconLabel: ACTIVITY_TYPES[activityType].label,
      });
    }

    totalCount += bidTotalCount;

    // ============================================================
    // Source 2: Reviews
    // ============================================================
    const reviewWhere = isOwner
      ? { fromUserId: userId }
      : { toContractorId: userId };

    const reviews = await db.review.findMany({
      where: reviewWhere,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        project: { select: { id: true, title: true } },
        fromUser: { select: { id: true, name: true } },
        toContractor: { select: { id: true, name: true } },
      },
    });

    const reviewTotalCount = await db.review.count({ where: reviewWhere });

    for (const review of reviews) {
      const description = isOwner
        ? `Anda memberikan review ${review.rating}/5 untuk "${review.project.title}"`
        : `${review.fromUser.name} memberikan review ${review.rating}/5 untuk "${review.project.title}"`;

      activities.push({
        id: `review-${review.id}`,
        type: 'REVIEW_GIVEN',
        description,
        timestamp: review.createdAt,
        relatedEntity: {
          type: 'review',
          id: review.id,
          title: review.project.title,
        },
        icon: ACTIVITY_TYPES.REVIEW_GIVEN.icon,
        iconLabel: ACTIVITY_TYPES.REVIEW_GIVEN.label,
      });
    }

    totalCount += reviewTotalCount;

    // ============================================================
    // Source 3: Projects created (for owners)
    // ============================================================
    if (isOwner) {
      const projects = await db.project.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, title: true, createdAt: true },
      });

      const projectTotalCount = await db.project.count({ where: { ownerId: userId } });

      for (const project of projects) {
        activities.push({
          id: `project-${project.id}`,
          type: 'PROJECT_CREATED',
          description: `Anda membuat proyek "${project.title}"`,
          timestamp: project.createdAt,
          relatedEntity: {
            type: 'project',
            id: project.id,
            title: project.title,
          },
          icon: ACTIVITY_TYPES.PROJECT_CREATED.icon,
          iconLabel: ACTIVITY_TYPES.PROJECT_CREATED.label,
        });
      }

      totalCount += projectTotalCount;
    }

    // ============================================================
    // Source 4: Milestones completed (for projects where user is involved)
    // ============================================================
    let milestoneWhere: Record<string, unknown> = {};

    if (isContractor) {
      // Contractor sees milestones for projects where they have accepted bids
      const acceptedProjects = await db.bid.findMany({
        where: { contractorId: userId, status: 'ACCEPTED' },
        select: { projectId: true },
      });
      const projectIds = acceptedProjects.map(p => p.projectId);
      milestoneWhere = {
        projectId: { in: projectIds },
        status: 'COMPLETED',
      };
    } else if (isOwner) {
      const ownerProjects = await db.project.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const projectIds = ownerProjects.map(p => p.id);
      milestoneWhere = {
        projectId: { in: projectIds },
        status: 'COMPLETED',
      };
    }

    if (Object.keys(milestoneWhere).length > 0) {
      const milestones = await db.projectMilestone.findMany({
        where: milestoneWhere,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: {
          project: { select: { id: true, title: true } },
        },
      });

      const milestoneTotalCount = await db.projectMilestone.count({ where: milestoneWhere });

      for (const ms of milestones) {
        activities.push({
          id: `milestone-${ms.id}`,
          type: 'MILESTONE_COMPLETED',
          description: `Milestone "${ms.title}" selesai untuk proyek "${ms.project.title}"`,
          timestamp: ms.completedAt || ms.updatedAt,
          relatedEntity: {
            type: 'milestone',
            id: ms.id,
            title: ms.title,
          },
          icon: ACTIVITY_TYPES.MILESTONE_COMPLETED.icon,
          iconLabel: ACTIVITY_TYPES.MILESTONE_COMPLETED.label,
        });
      }

      totalCount += milestoneTotalCount;
    }

    // ============================================================
    // Source 5: Certifications (for contractors)
    // ============================================================
    if (isContractor) {
      const certifications = await db.certification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, type: true, number: true, createdAt: true },
      });

      const certTotalCount = await db.certification.count({ where: { userId } });

      for (const cert of certifications) {
        activities.push({
          id: `cert-${cert.id}`,
          type: 'CERTIFICATION_ADDED',
          description: `Sertifikasi ${cert.type} (${cert.number}) ditambahkan`,
          timestamp: cert.createdAt,
          relatedEntity: {
            type: 'certification',
            id: cert.id,
          },
          icon: ACTIVITY_TYPES.CERTIFICATION_ADDED.icon,
          iconLabel: ACTIVITY_TYPES.CERTIFICATION_ADDED.label,
        });
      }

      totalCount += certTotalCount;
    }

    // ============================================================
    // Source 6: Activity Logs (general)
    // ============================================================
    try {
      const activityLogs = await db.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const logTotalCount = await db.activityLog.count({ where: { userId } });

      for (const log of activityLogs) {
        // Only include if not already covered by specific sources
        const alreadyExists = activities.some(a => a.description === log.description);
        if (!alreadyExists) {
          let activityType: ActivityType = 'BID_SUBMITTED';
          if (log.action.includes('MILESTONE')) activityType = 'MILESTONE_COMPLETED';
          else if (log.action.includes('BID')) activityType = 'BID_SUBMITTED';
          else if (log.action.includes('REVIEW')) activityType = 'REVIEW_GIVEN';
          else if (log.action.includes('PROJECT')) activityType = 'PROJECT_CREATED';
          else if (log.action.includes('CERT')) activityType = 'CERTIFICATION_ADDED';

          activities.push({
            id: `log-${log.id}`,
            type: activityType,
            description: log.description,
            timestamp: log.createdAt,
            relatedEntity: {
              type: 'activity_log',
              id: log.id,
            },
            icon: ACTIVITY_TYPES[activityType]?.icon || 'Activity',
            iconLabel: ACTIVITY_TYPES[activityType]?.label || 'Aktivitas',
          });
        }
      }

      totalCount += logTotalCount;
    } catch {
      // activityLog model might not be available
    }

    // ============================================================
    // Sort all activities by timestamp (newest first) and paginate
    // ============================================================
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const skip = (page - 1) * limit;
    const paginatedActivities = activities.slice(skip, skip + limit);

    // Remove duplicates (same description + same timestamp within 1 second)
    const seen = new Set<string>();
    const uniqueActivities = paginatedActivities.filter(a => {
      const key = `${a.description}-${a.timestamp.getTime()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      success: true,
      activities: uniqueActivities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      activityTypes: Object.fromEntries(
        Object.entries(ACTIVITY_TYPES).map(([k, v]) => [k, { icon: v.icon, label: v.label }])
      ),
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({
      success: true,
      activities: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  }
}
