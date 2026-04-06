import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const specialization = searchParams.get('specialization');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: Record<string, unknown> = {
      role: 'CONTRACTOR',
    };

    // If location filter, filter by city or province
    const contractorWhere: Record<string, unknown> = {};
    if (location) {
      contractorWhere.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { province: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } },
      ];
    }
    if (specialization) {
      contractorWhere.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (Object.keys(contractorWhere).length > 0) {
      where.contractor = contractorWhere;
    }

    // Fetch all matching contractors
    const contractors = await db.user.findMany({
      where,
      include: {
        contractor: {
          include: {
            portfolios: {
              take: 3,
              orderBy: { createdAt: 'desc' },
            },
            certifications: {
              where: { isVerified: true },
            },
            badges: true,
          },
        },
        documents: {
          where: { verified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sort: prioritize Indonesian-verified contractors
    const sortedContractors = contractors.sort((a, b) => {
      const aLocalScore = getLocalScore(a);
      const bLocalScore = getLocalScore(b);
      if (bLocalScore !== aLocalScore) return bLocalScore - aLocalScore;
      // Then by rating
      const aRating = a.contractor?.rating || 0;
      const bRating = b.contractor?.rating || 0;
      return bRating - aRating;
    });

    // Pagination
    const total = sortedContractors.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedContractors = sortedContractors.slice((page - 1) * limit, page * limit);

    const formattedContractors = paginatedContractors.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      avatar: c.avatar,
      isVerified: c.isVerified,
      verificationStatus: c.verificationStatus,
      isLocal: hasLocalBadge(c),
      company: c.contractor ? {
        name: c.contractor.companyName,
        type: c.contractor.companyType,
        specialization: c.contractor.specialization,
        experienceYears: c.contractor.experienceYears,
        employeeCount: c.contractor.employeeCount,
        rating: c.contractor.rating,
        totalProjects: c.contractor.totalProjects,
        completedProjects: c.contractor.completedProjects,
        city: c.contractor.city,
        province: c.contractor.province,
        description: c.contractor.description,
      } : null,
      certifications: (c.contractor?.certifications || []).map(cert => ({
        id: cert.id,
        type: cert.type,
        number: cert.number,
        issuedBy: cert.issuedBy,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        isVerified: cert.isVerified,
      })),
      badges: (c.contractor?.badges || []).map(badge => ({
        id: badge.id,
        type: badge.type,
        label: badge.label,
        description: badge.description,
        icon: badge.icon,
        earnedAt: badge.earnedAt,
      })),
      portfolios: c.contractor?.portfolios || [],
      verifiedDocuments: c.documents.length,
    }));

    return NextResponse.json({
      success: true,
      contractors: formattedContractors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get local contractors error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat kontraktor lokal' },
      { status: 500 }
    );
  }
}

// Helper: Calculate local score for sorting priority
function getLocalScore(user: {
  isVerified: boolean;
  contractor: {
    certifications: Array<{ type: string; isVerified: boolean }>;
    badges: Array<{ type: string }>;
    province?: string | null;
    city?: string | null;
  } | null;
}): number {
  let score = 0;
  if (!user.contractor) return score;

  // Has verified Indonesian certifications
  const indonesianCertTypes = ['SIUJK', 'SBU', 'SKA', 'SKT'];
  const verifiedIndonesianCerts = user.contractor.certifications.filter(
    cert => indonesianCertTypes.includes(cert.type) && cert.isVerified
  );
  score += verifiedIndonesianCerts.length * 3;

  // Has LOCAL_CHAMPION badge
  if (user.contractor.badges.some(b => b.type === 'LOCAL_CHAMPION')) score += 5;

  // Has CERTIFIED badge
  if (user.contractor.badges.some(b => b.type === 'CERTIFIED')) score += 3;

  // Has VERIFIED badge
  if (user.contractor.badges.some(b => b.type === 'VERIFIED')) score += 2;

  // User is verified
  if (user.isVerified) score += 2;

  // Has Indonesian province/city
  const indonesianLocations = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Yogyakarta', 'Denpasar', 'Palembang', 'Balikpapan', 'Manado', 'Malang', 'Padang', 'Pekanbaru'];
  if (user.contractor.city && indonesianLocations.some(loc => user.contractor!.city!.includes(loc))) score += 1;

  return score;
}

// Helper: Check if contractor has local champion badge
function hasLocalBadge(user: {
  contractor: {
    badges: Array<{ type: string }>;
    certifications: Array<{ type: string; isVerified: boolean }>;
  } | null;
}): boolean {
  if (!user.contractor) return false;
  return user.contractor.badges.some(b => b.type === 'LOCAL_CHAMPION') ||
    user.contractor.certifications.some(c =>
      ['SIUJK', 'SBU', 'SKA', 'SKT'].includes(c.type) && c.isVerified
    );
}
