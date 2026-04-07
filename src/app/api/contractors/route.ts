import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const contractors = await db.user.findMany({
      where: {
        role: 'CONTRACTOR',
      },
      include: {
        contractor: {
          include: {
            portfolios: {
              take: 3,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        documents: {
          where: { verified: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedContractors = contractors.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      avatar: c.avatar,
      isVerified: c.isVerified,
      verificationStatus: c.verificationStatus,
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
      portfolios: c.contractor?.portfolios || [],
      verifiedDocuments: c.documents.length,
    }));

    return NextResponse.json({ contractors: formattedContractors });
  } catch (error) {
    console.error('Get contractors error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
