import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ExportDataRow {
  title: string;
  value: string | number;
}

// GET - Get export data for reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') || 'summary';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user data
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let exportData: ExportDataRow[] = [];
    let reportTitle = '';
    let reportSubtitle = '';

    if (user.role === 'OWNER') {
      // Owner export
      const projects = await db.project.findMany({
        where: { ownerId: userId },
        include: {
          bids: {
            include: {
              contractor: true,
            },
          },
          milestones: true,
        },
      });

      if (projectId && projectId !== 'all') {
        // Single project export
        const project = projects.find(p => p.id === projectId);
        if (!project) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        reportTitle = `Laporan Proyek: ${project.title}`;
        reportSubtitle = `Diekspor pada ${new Date().toLocaleDateString('id-ID')}`;

        const totalBudget = project.budget || 0;
        const totalBids = project.bids?.length || 0;
        const acceptedBid = project.bids?.find(b => b.status === 'ACCEPTED');

        exportData = [
          { title: 'Judul Proyek', value: project.title },
          { title: 'Kategori', value: project.category },
          { title: 'Lokasi', value: project.location },
          { title: 'Anggaran', value: `Rp ${totalBudget.toLocaleString('id-ID')}` },
          { title: 'Status', value: project.status },
          { title: 'Total Penawaran', value: totalBids },
          { title: '', value: '' },
          { title: '--- PENAWARAN ---', value: '' },
        ];

        project.bids?.forEach((bid, idx) => {
          exportData.push({ title: `${idx + 1}. ${bid.contractor?.name || 'Kontraktor'}`, value: bid.status });
          exportData.push({ title: '   Harga Penawaran', value: `Rp ${(bid.price || 0).toLocaleString('id-ID')}` });
          exportData.push({ title: '   Durasi', value: `${bid.duration || '-'} hari` });
        });
      } else {
        // All projects summary
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const totalBids = projects.reduce((sum, p) => sum + (p.bids?.length || 0), 0);
        const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
        const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
        const openProjects = projects.filter(p => p.status === 'OPEN').length;

        reportTitle = 'Laporan Ringkasan Proyek';
        reportSubtitle = `Diekspor pada ${new Date().toLocaleDateString('id-ID')}`;

        exportData = [
          { title: 'Total Proyek', value: projects.length },
          { title: 'Proyek Aktif', value: activeProjects },
          { title: 'Proyek Selesai', value: completedProjects },
          { title: 'Tender Terbuka', value: openProjects },
          { title: 'Total Anggaran', value: `Rp ${totalBudget.toLocaleString('id-ID')}` },
          { title: 'Total Penawaran', value: totalBids },
          { title: '', value: '' },
          { title: '--- DETAIL PROYEK ---', value: '' },
        ];

        projects.forEach((project, idx) => {
          exportData.push({ title: `${idx + 1}. ${project.title}`, value: project.status });
          exportData.push({ title: '   Kategori', value: project.category });
          exportData.push({ title: '   Lokasi', value: project.location });
          exportData.push({ title: '   Anggaran', value: `Rp ${(project.budget || 0).toLocaleString('id-ID')}` });
          exportData.push({ title: '   Penawaran', value: project.bids?.length || 0 });
        });
      }
    } else if (user.role === 'CONTRACTOR') {
      // Contractor export
      const contractorProfile = await db.contractorProfile.findUnique({
        where: { userId },
      });

      const bids = await db.bid.findMany({
        where: { contractorId: contractorProfile?.id },
        include: {
          project: {
            include: {
              owner: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      const acceptedBids = bids.filter(b => b.status === 'ACCEPTED').length;
      const pendingBids = bids.filter(b => b.status === 'PENDING').length;
      const totalBidAmount = bids.reduce((sum, b) => sum + (b.price || 0), 0);

      reportTitle = 'Laporan Kontraktor';
      reportSubtitle = `Diekspor pada ${new Date().toLocaleDateString('id-ID')}`;

      exportData = [
        { title: 'Nama Kontraktor', value: user.name },
        { title: 'Perusahaan', value: contractorProfile?.companyName || '-' },
        { title: 'Total Penawaran', value: bids.length },
        { title: 'Diterima', value: acceptedBids },
        { title: 'Pending', value: pendingBids },
        { title: 'Total Nilai Penawaran', value: `Rp ${totalBidAmount.toLocaleString('id-ID')}` },
        { title: '', value: '' },
        { title: '--- RIWAYAT PENAWARAN ---', value: '' },
      ];

      bids.slice(0, 20).forEach((bid, idx) => {
        exportData.push({ title: `${idx + 1}. ${bid.project?.title || '-'}`, value: bid.status });
        exportData.push({ title: '   Harga Penawaran', value: `Rp ${(bid.price || 0).toLocaleString('id-ID')}` });
        exportData.push({ title: '   Durasi', value: `${bid.duration || '-'} hari` });
        exportData.push({ title: '   Pemilik Proyek', value: bid.project?.owner?.name || '-' });
      });
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      title: reportTitle,
      subtitle: reportSubtitle,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
