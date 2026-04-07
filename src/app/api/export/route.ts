import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Format currency to Indonesian Rupiah
function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// GET - Export project report
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const projectId = request.nextUrl.searchParams.get('projectId');
    const format = request.nextUrl.searchParams.get('format') || 'csv';
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get projects data
    let projects: any[];
    if (projectId) {
      projects = await db.project.findMany({
        where: { id: projectId, ownerId: userId },
        include: {
          bids: {
            include: {
              contractor: {
                include: { contractor: true }
              }
            }
          }
        }
      });
    } else {
      projects = await db.project.findMany({
        where: { ownerId: userId },
        include: {
          bids: {
            include: {
              contractor: {
                include: { contractor: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (format === 'csv') {
      // Generate CSV
      const csvRows: string[] = [];
      
      // Header row
      csvRows.push([
        'No',
        'Judul Proyek',
        'Kategori',
        'Lokasi',
        'Anggaran',
        'Status',
        'Jumlah Penawaran',
        'Penawaran Terendah',
        'Penawaran Tertinggi',
        'Tanggal Dibuat'
      ].join(','));

      // Data rows
      projects.forEach((project, index) => {
        const bids = project.bids || [];
        const prices = bids.map(b => b.price).filter(p => p > 0);
        const lowestBid = prices.length > 0 ? Math.min(...prices) : 0;
        const highestBid = prices.length > 0 ? Math.max(...prices) : 0;

        csvRows.push([
          index + 1,
          `"${project.title.replace(/"/g, '""')}"`,
          project.category,
          `"${project.location.replace(/"/g, '""')}"`,
          project.budget,
          project.status,
          bids.length,
          lowestBid,
          highestBid,
          new Date(project.createdAt).toLocaleDateString('id-ID')
        ].join(','));
      });

      const csvContent = csvRows.join('\n');
      const fileName = projectId ? `project-report-${projectId}.csv` : `projects-report-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }

    // JSON format
    return NextResponse.json({ 
      projects: projects.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        location: p.location,
        budget: p.budget,
        status: p.status,
        bidCount: p.bids?.length || 0,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}
