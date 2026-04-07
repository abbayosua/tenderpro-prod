import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Returns available filter options for project search
export async function GET() {
  try {
    // 1. Categories: all unique project categories from database
    const categoryAggregation = await db.project.groupBy({
      by: ['category'],
      where: { status: { not: 'CANCELLED' } },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    const categories = categoryAggregation.map((c) => ({
      value: c.category,
      label: c.category,
      count: c._count.category,
    }));

    // 2. Locations: all unique cities extracted from project location field
    const projects = await db.project.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { location: true },
      distinct: ['location'],
    });

    // Extract unique cities from location strings (format: "City, Province")
    const locationMap = new Map<string, number>();
    projects.forEach((p) => {
      if (p.location) {
        const city = p.location.split(',')[0].trim();
        if (city) {
          locationMap.set(city, (locationMap.get(city) || 0) + 1);
        }
      }
    });

    const locations = Array.from(locationMap.entries())
      .map(([city, count]) => ({ value: city, label: city, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Budget ranges: predefined ranges with counts
    const budgetRanges = [
      { value: '0-500000000', label: 'Di bawah Rp 500 Juta', min: 0, max: 500000000 },
      { value: '500000000-1000000000', label: 'Rp 500 Juta - Rp 1 Miliar', min: 500000000, max: 1000000000 },
      { value: '1000000000-5000000000', label: 'Rp 1 - 5 Miliar', min: 1000000000, max: 5000000000 },
      { value: '5000000000-10000000000', label: 'Rp 5 - 10 Miliar', min: 5000000000, max: 10000000000 },
      { value: '10000000000-999999999999', label: 'Di atas Rp 10 Miliar', min: 10000000000, max: 999999999999 },
    ];

    const allActiveProjects = await db.project.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { budget: true },
    });

    const budgetRangeCounts = budgetRanges.map((range) => {
      const count = allActiveProjects.filter(
        (p) => p.budget >= range.min && p.budget <= range.max
      ).length;
      return {
        value: range.value,
        label: range.label,
        count,
      };
    });

    // 4. Durations: predefined ranges with counts
    const durationRanges = [
      { value: '0-90', label: '1-3 bulan', min: 0, max: 90 },
      { value: '90-180', label: '3-6 bulan', min: 90, max: 180 },
      { value: '180-365', label: '6-12 bulan', min: 180, max: 365 },
      { value: '365-99999', label: 'Lebih dari 12 bulan', min: 365, max: 99999 },
    ];

    const projectsWithDuration = await db.project.findMany({
      where: {
        status: { not: 'CANCELLED' },
        duration: { not: null },
      },
      select: { duration: true },
    });

    const durationRangeCounts = durationRanges.map((range) => {
      const count = projectsWithDuration.filter(
        (p) => p.duration && p.duration >= range.min && p.duration <= range.max
      ).length;
      return {
        value: range.value,
        label: range.label,
        count,
      };
    });

    // 5. Statuses: all unique project statuses with counts
    const statusAggregation = await db.project.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statusLabels: Record<string, string> = {
      DRAFT: 'Draf',
      OPEN: 'Terbuka',
      IN_PROGRESS: 'Berjalan',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    };

    const statuses = statusAggregation.map((s) => ({
      value: s.status,
      label: statusLabels[s.status] || s.status,
      count: s._count.status,
    }));

    // 6. Sort options (static)
    const sortOptions = [
      { value: 'newest', label: 'Terbaru' },
      { value: 'oldest', label: 'Terlama' },
      { value: 'budget_high', label: 'Anggaran Tertinggi' },
      { value: 'budget_low', label: 'Anggaran Terendah' },
      { value: 'bid_count_high', label: 'Penawaran Terbanyak' },
      { value: 'bid_count_low', label: 'Penawaran Tersedikit' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        categories,
        locations,
        budgetRanges: budgetRangeCounts,
        durationRanges: durationRangeCounts,
        statuses,
        sortOptions,
        totalActiveProjects: allActiveProjects.length,
      },
    });
  } catch (error) {
    console.error('Gagal memuat opsi filter proyek:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat memuat opsi filter',
        data: {
          categories: [],
          locations: [],
          budgetRanges: [],
          durationRanges: [],
          statuses: [],
          sortOptions: [],
          totalActiveProjects: 0,
        },
      },
      { status: 500 }
    );
  }
}
