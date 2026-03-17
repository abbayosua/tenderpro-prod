'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ScrollArea } from '@/components/ui';
import { ChartContainer } from '@/components/ui/chart';
import {
  ChartTooltip, ChartTooltipContent, type ChartConfig
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Building2, Star, MapPin, Clock, Briefcase, CheckCircle, ChevronRight,
  FileText, Eye, Upload, Plus, DollarSign, BarChart3,
  Video, Flag, FolderOpen, Search, Scale, Heart, Zap, Trash2, Download, Calendar,
  MessageSquare, Bell, X, User, LogOut
} from 'lucide-react';
import { ChatModal } from '@/components/modals/ChatModal';
import { toast } from 'sonner';
import { OwnerStats, Milestone, Favorite, Notification, Project } from '@/types';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/helpers';
import { StatsCard } from '@/components/shared/StatsCard';
import { VerificationAlert } from '@/components/shared/VerificationAlert';
import { NotificationPanel } from '@/components/shared/NotificationPanel';
import { WebcamUploadModal } from '@/components/modals/WebcamUploadModal';
import type { ChartData, PaymentSummary } from '@/hooks/useDashboard';
import {
  OwnerProjectsTab,
  OwnerBidsTab,
  OwnerFavoritesTab,
  OwnerTimelineTab,
  OwnerDocumentsTab,
  OwnerPaymentsTab,
} from './owner/tabs';
import type { AllProjectDocument } from '@/hooks/useDashboard';

// Define the props interface
interface OwnerDashboardProps {
  user: { id: string; name: string; verificationStatus: string; avatar?: string };
  ownerStats: OwnerStats;
  notifications: Notification[];
  unreadCount: number;
  favorites: Favorite[];
  milestones: Milestone[];
  progressPercent: number;
  selectedBidsForCompare: string[];
  chartData: ChartData | null;
  paymentSummary: PaymentSummary | null;
  allProjectDocuments: AllProjectDocument[];
  onLogout: () => void;
  onShowVerification: () => void;
  onShowCreateProject: () => void;
  onShowCCTV: (project: { id: string; title: string; status: string }) => void;
  onShowProgress: (project: { id: string; title: string; category: string; budget: number }) => void;
  onShowCompare: () => void;
  onShowExport: () => void;
  onAcceptBid: (bidId: string) => void;
  onRejectBid: (bidId: string) => void;
  onAddFavorite: (contractorId: string, notes?: string) => void;
  onRemoveFavorite: (favoriteId: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onUpdateMilestone: (milestoneId: string, status: string, projectId?: string) => void;
  toggleBidSelection: (bidId: string) => void;
  loadMilestones: (projectId: string) => void;
}

const chartConfig: ChartConfig = {
  primary: { label: 'Pembangunan Baru', color: 'hsl(var(--primary))' },
  chart2: { label: 'Renovasi', color: 'hsl(var(--chart-2))' },
  chart3: { label: 'Komersial', color: 'hsl(var(--chart-3))' },
  chart4: { label: 'Interior', color: 'hsl(var(--chart-4))' },
  muted: { label: 'Lainnya', color: 'hsl(var(--muted-foreground))' },
  proyek: { label: 'Proyek Baru', color: 'hsl(var(--primary))' },
  selesai: { label: 'Proyek Selesai', color: 'hsl(var(--chart-4))' },
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--muted-foreground))',
];

export function OwnerDashboard({
  user,
  ownerStats,
  notifications,
  unreadCount,
  favorites,
  milestones,
  progressPercent,
  selectedBidsForCompare,
  chartData,
  paymentSummary,
  allProjectDocuments,
  onLogout,
  onShowVerification,
  onShowCreateProject,
  onShowCCTV,
  onShowProgress,
  onShowCompare,
  onShowExport,
  onAcceptBid,
  onRejectBid,
  onAddFavorite,
  onRemoveFavorite,
  onMarkNotificationRead,
  onMarkAllRead,
  onUpdateMilestone,
  toggleBidSelection,
  loadMilestones,
}: OwnerDashboardProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDocType, setFilterDocType] = useState('all');
  const [filterDocProject, setFilterDocProject] = useState('all');
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [filterBidProject, setFilterBidProject] = useState('all');
  const [sortBidsBy, setSortBidsBy] = useState<'newest' | 'lowest' | 'rating'>('newest');

  
  // Handle document upload from webcam
  const handleDocumentUpload = async (data: { name: string; type: string; fileUrl: string; fileSize: number }) => {
    try {
      const res = await fetch('/api/owner-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: filterDocProject !== 'all' ? filterDocProject : ownerStats.projects[0]?.id,
          uploadedBy: user.id,
          name: data.name,
          type: data.type,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Dokumen berhasil diunggah!');
        window.location.reload();
        return true;
      } else {
        toast.error(result.error || 'Gagal mengunggah dokumen');
        return false;
      }
    } catch {
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  // Memoize chart data transformations
  const projectCategoryData = useMemo(() => {
    if (!chartData?.categoryData || chartData.categoryData.length === 0) {
      return [
        { name: 'Pembangunan Baru', value: 35, fill: CHART_COLORS[0] },
        { name: 'Renovasi', value: 25, fill: CHART_COLORS[1] },
        { name: 'Komersial', value: 20, fill: CHART_COLORS[2] },
        { name: 'Interior', value: 15, fill: CHART_COLORS[3] },
        { name: 'Lainnya', value: 5, fill: CHART_COLORS[4] },
      ];
    }
    return chartData.categoryData.map((item, idx) => ({
      name: item.name,
      value: item.value,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [chartData]);

  const monthlyProgressData = useMemo(() => {
    if (!chartData?.monthlyProgressData || chartData.monthlyProgressData.length === 0) {
      return [
        { month: 'Jan', proyek: 2, selesai: 1 },
        { month: 'Feb', proyek: 2, selesai: 2 },
        { month: 'Mar', proyek: 4, selesai: 3 },
        { month: 'Apr', proyek: 2, selesai: 2 },
        { month: 'Mei', proyek: 5, selesai: 4 },
        { month: 'Jun', proyek: 3, selesai: 3 },
      ];
    }
    return chartData.monthlyProgressData;
  }, [chartData]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    if (!allProjectDocuments || allProjectDocuments.length === 0) return [];
    return allProjectDocuments.filter(doc => {
      if (filterDocType !== 'all' && doc.type !== filterDocType) return false;
      if (filterDocProject !== 'all' && doc.projectId !== filterDocProject) return false;
      return true;
    });
  }, [allProjectDocuments, filterDocType, filterDocProject]);

  // Calculate real progress for each project
  const getProjectProgress = (projectId: string) => {
    const project = ownerStats.projects.find(p => p.id === projectId);
    if (!project) return 0;
    if (project.status === 'COMPLETED') return 100;
    if (project.status === 'IN_PROGRESS') {
      const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
      const totalMilestones = milestones.length || 1;
      return Math.round((completedMilestones / totalMilestones) * 100);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TenderPro" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-slate-800">TenderPro</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={showNotifications}
              onToggle={() => setShowNotifications(!showNotifications)}
              onMarkRead={onMarkNotificationRead}
              onMarkAllRead={onMarkAllRead}
            />
            <Button variant="ghost" size="icon" className="relative" onClick={() => setChatModalOpen(true)}>
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-slate-500">Pemilik Proyek</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <VerificationAlert user={user} onUploadClick={onShowVerification} />

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Total Proyek"
            value={ownerStats.totalProjects}
            icon={FolderOpen}
            trend={ownerStats.trends?.totalProjects?.value || '+0%'}
            trendUp={ownerStats.trends?.totalProjects?.isUp ?? true}
            color="primary"
          />
          <StatsCard
            label="Proyek Aktif"
            value={ownerStats.activeProjects}
            icon={Building2}
            trend={ownerStats.trends?.activeProjects?.value || '+0%'}
            trendUp={ownerStats.trends?.activeProjects?.isUp ?? true}
            color="blue"
          />
          <StatsCard
            label="Tender Terbuka"
            value={ownerStats.openProjects}
            icon={FileText}
            trend={ownerStats.trends?.openProjects?.value || '+0%'}
            trendUp={ownerStats.trends?.openProjects?.isUp ?? false}
            color="yellow"
          />
          <StatsCard
            label="Penawaran Pending"
            value={ownerStats.totalPendingBids}
            icon={Clock}
            trend={ownerStats.trends?.pendingBids?.value || '+0%'}
            trendUp={ownerStats.trends?.pendingBids?.isUp ?? true}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onShowCreateProject}>
            <Plus className="h-4 w-4 mr-2" /> Buat Proyek Baru
          </Button>
          <Button variant="outline" onClick={() => {
            const bidsTab = document.querySelector('[value="bids"]') as HTMLButtonElement;
            if (bidsTab) bidsTab.click();
          }}>
            <Eye className="h-4 w-4 mr-2" /> Lihat Semua Penawaran
          </Button>
          <Button variant="outline" onClick={onShowExport}>
            <BarChart3 className="h-4 w-4 mr-2" /> Laporan
          </Button>
          <Button variant="outline" onClick={() => {
            const firstInProgress = ownerStats.projects.find(p => p.status === 'IN_PROGRESS');
            if (firstInProgress) {
              onShowCCTV({ id: firstInProgress.id, title: firstInProgress.title, status: firstInProgress.status });
            } else {
              toast.info('Tidak ada proyek yang sedang berjalan');
            }
          }}>
            <Video className="h-4 w-4 mr-2" /> CCTV Proyek
          </Button>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proyek per Kategori</CardTitle>
              <CardDescription>Distribusi proyek berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <PieChart>
                  <Pie
                    data={projectCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {projectCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Bulanan</CardTitle>
              <CardDescription>Proyek baru vs selesai per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={monthlyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="proyek" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="selesai" fill="var(--color-yellow)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="projects"><FolderOpen className="h-4 w-4 mr-2" /> Proyek Saya</TabsTrigger>
            <TabsTrigger value="bids"><FileText className="h-4 w-4 mr-2" /> Penawaran Masuk</TabsTrigger>
            <TabsTrigger value="timeline"><Flag className="h-4 w-4 mr-2" /> Timeline</TabsTrigger>
            <TabsTrigger value="documents"><FolderOpen className="h-4 w-4 mr-2" /> Dokumen</TabsTrigger>
            <TabsTrigger value="payments"><DollarSign className="h-4 w-4 mr-2" /> Pembayaran</TabsTrigger>
            <TabsTrigger value="favorites"><Star className="h-4 w-4 mr-2" /> Favorit</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <OwnerProjectsTab
              ownerStats={ownerStats}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onShowCreateProject={onShowCreateProject}
              onShowCCTV={onShowCCTV}
              onShowProgress={onShowProgress}
              onAcceptBid={onAcceptBid}
              onRejectBid={onRejectBid}
              loadMilestones={loadMilestones}
              milestones={milestones}
            />
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids">
            <OwnerBidsTab
              ownerStats={ownerStats}
              selectedBidsForCompare={selectedBidsForCompare}
              toggleBidSelection={toggleBidSelection}
              onShowCompare={onShowCompare}
              onAcceptBid={onAcceptBid}
              onRejectBid={onRejectBid}
              onAddFavorite={onAddFavorite}
              onShowCCTV={onShowCCTV}
              onShowProgress={onShowProgress}
              onShowCreateProject={onShowCreateProject}
              loadMilestones={loadMilestones}
              filterBidProject={filterBidProject}
              setFilterBidProject={setFilterBidProject}
              sortBidsBy={sortBidsBy}
              setSortBidsBy={setSortBidsBy}
            />
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <OwnerFavoritesTab
              favorites={favorites}
              onRemoveFavorite={onRemoveFavorite}
            />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <OwnerTimelineTab
              ownerStats={ownerStats}
              onShowCreateProject={onShowCreateProject}
              onShowCCTV={onShowCCTV}
              onShowProgress={onShowProgress}
              onAcceptBid={onAcceptBid}
              onRejectBid={onRejectBid}
              loadMilestones={loadMilestones}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <OwnerDocumentsTab
              ownerStats={ownerStats}
              allProjectDocuments={allProjectDocuments}
              filterDocType={filterDocType}
              setFilterDocType={setFilterDocType}
              filterDocProject={filterDocProject}
              setFilterDocProject={setFilterDocProject}
              webcamModalOpen={webcamModalOpen}
              setWebcamModalOpen={setWebcamModalOpen}
              onDocumentUpload={handleDocumentUpload}
            />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <OwnerPaymentsTab
              ownerStats={ownerStats}
              paymentSummary={paymentSummary}
            />
          </TabsContent>
        </Tabs>

        {/* Webcam Upload Modal */}
        <WebcamUploadModal
          open={webcamModalOpen}
          onOpenChange={setWebcamModalOpen}
          onUpload={handleDocumentUpload}
          projects={ownerStats.projects}
        />

        {/* Chat Modal */}
        <ChatModal
          open={chatModalOpen}
          onOpenChange={setChatModalOpen}
          currentUser={{ id: user.id, name: user.name, avatar: user.avatar }}
        />
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-6 text-center text-sm mt-8">
        <p>© 2024 TenderPro. All rights reserved.</p>
      </footer>
    </div>
  );
}
