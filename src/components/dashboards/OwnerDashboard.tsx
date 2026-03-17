'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Building2, Star, MapPin, Clock, Briefcase, CheckCircle, TrendingUp, ChevronRight,
  FileText, Eye, Upload, Plus, ArrowUpRight, ArrowDownRight, DollarSign, BarChart3,
  Video, Flag, FolderOpen, Search, Scale, Heart, Zap, Trash2, Download, Calendar,
  MessageSquare, Bell, X, User, LogOut, Building, Award, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { OwnerStats, Bid, Contractor, Milestone, Favorite, Notification, Project } from '@/types';
import { formatRupiah, calculateMatchScore, getStatusColor, getStatusLabel } from '@/lib/helpers';
import { StatsCard } from '@/components/shared/StatsCard';
import { VerificationAlert } from '@/components/shared/VerificationAlert';
import { NotificationPanel } from '@/components/shared/NotificationPanel';
import { WebcamUploadModal } from '@/components/modals/WebcamUploadModal';
import type { ChartData, PaymentSummary } from '@/hooks/useDashboard';

const chartConfig: ChartConfig = {
  primary: { label: 'Pembangunan Baru', color: 'hsl(var(--primary))' },
  chart2: { label: 'Renovasi', color: 'hsl(var(--chart-2))' },
  chart3: { label: 'Komersial', color: 'hsl(var(--chart-3))' },
  chart4: { label: 'Interior', color: 'hsl(var(--chart-4))' },
  muted: { label: 'Lainnya', color: 'hsl(var(--muted-foreground))' },
  proyek: { label: 'Proyek Baru', color: 'hsl(var(--primary))' },
  selesai: { label: 'Proyek Selesai', color: 'hsl(var(--chart-4))' },
};

// Chart colors
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--muted-foreground))',
];

interface OwnerDashboardProps {
  user: { id: string; name: string; verificationStatus: string };
  ownerStats: OwnerStats;
  notifications: Notification[];
  unreadCount: number;
  favorites: Favorite[];
  milestones: Milestone[];
  progressPercent: number;
  selectedBidsForCompare: string[];
  chartData: ChartData | null;
  paymentSummary: PaymentSummary | null;
  allProjectDocuments: Array<{
    id: string;
    name: string;
    type: string;
    projectId: string;
    project: string;
    fileSize: number;
    fileUrl: string;
    isApproved: boolean;
    createdAt: Date;
  }>;
  onLogout: () => void;
  onShowVerification: () => void;
  onShowCreateProject: () => void;
  onShowCCTV: (project: { id: string; title: string; status: string }) => void;
  onShowProgress: (project: { id: string; title: string; category: string; budget: number }) => void;
  onShowCompare: () => void;
  onShowExport: () => void;
  onAcceptBid: (bidId: string) => void;
  onRejectBid: (bidId: string) => void;
  onAddFavorite: (contractorId: string) => void;
  onRemoveFavorite: (favoriteId: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onUpdateMilestone: (milestoneId: string, status: string) => void;
  toggleBidSelection: (bidId: string) => void;
  loadMilestones: (projectId: string) => void;
}

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
        // Reload documents
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

  const filteredProjects = ownerStats.projects
    .filter(project => filterStatus === 'all' || project.status === filterStatus)
    .filter(project => searchQuery === '' || project.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Memoize chart data transformations
  const projectCategoryData = useMemo(() => {
    if (!chartData?.categoryData || chartData.categoryData.length === 0) {
      // Default fallback data
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
      // Default fallback data
      return [
        { month: 'Jan', proyek: 2, selesai: 1 },
        { month: 'Feb', proyek: 3, selesai: 2 },
        { month: 'Mar', proyek: 4, selesai: 3 },
        { month: 'Apr', proyek: 3, selesai: 2 },
        { month: 'Mei', proyek: 5, selesai: 4 },
        { month: 'Jun', proyek: 4, selesai: 3 },
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
    // This would normally come from milestones API
    // For now, calculate from ownerStats if available
    const project = ownerStats.projects.find(p => p.id === projectId);
    if (!project) return 0;
    if (project.status === 'COMPLETED') return 100;
    if (project.status === 'IN_PROGRESS') {
      // Calculate from milestones if loaded
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
          <div className="flex items-center gap-4">
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={showNotifications}
              onToggle={() => setShowNotifications(!showNotifications)}
              onMarkRead={onMarkNotificationRead}
              onMarkAllRead={onMarkAllRead}
            />
            <Button variant="ghost" size="icon" className="relative">
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
          <StatsCard label="Total Proyek" value={ownerStats.totalProjects} icon={FolderOpen} trend="+12%" trendUp color="primary" />
          <StatsCard label="Proyek Aktif" value={ownerStats.activeProjects} icon={Building2} trend="+5%" trendUp color="blue" />
          <StatsCard label="Tender Terbuka" value={ownerStats.openProjects} icon={FileText} trend="-2%" trendUp={false} color="yellow" />
          <StatsCard label="Penawaran Pending" value={ownerStats.totalPendingBids} icon={Clock} trend="+8%" trendUp color="purple" />
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Cari proyek..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="OPEN">Tender Terbuka</SelectItem>
                    <SelectItem value="IN_PROGRESS">Sedang Berjalan</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">Belum ada proyek</p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onShowCreateProject}>
                    <Plus className="h-4 w-4 mr-2" /> Buat Proyek Pertama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (project.status === 'IN_PROGRESS') {
                      onShowCCTV({ id: project.id, title: project.title, status: project.status });
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{project.category}</Badge>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                          {project.status === 'IN_PROGRESS' && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Video className="h-3 w-3" /> CCTV Live
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {project.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Anggaran</p>
                        <p className="text-xl font-bold text-primary">{formatRupiah(project.budget)}</p>
                      </div>
                    </div>

                    {project.status === 'IN_PROGRESS' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium">65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShowProgress({ id: project.id, title: project.title, category: project.category, budget: project.budget });
                              loadMilestones(project.id);
                            }}
                          >
                            <Flag className="h-4 w-4 mr-2" /> Detail Progress
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShowCCTV({ id: project.id, title: project.title, status: project.status });
                            }}
                          >
                            <Video className="h-4 w-4 mr-2" /> Lihat CCTV
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {project.bidCount} Penawaran</span>
                        <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> views</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        if (project.status === 'IN_PROGRESS') {
                          onShowProgress({ id: project.id, title: project.title, category: project.category, budget: project.budget });
                          loadMilestones(project.id);
                        }
                      }}>
                        Lihat Detail <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {project.bids.length > 0 && project.status === 'OPEN' && (
                      <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                        <h4 className="font-semibold mb-3">Penawaran Terbaru</h4>
                        <ScrollArea className="h-48">
                          {project.bids.map((bid) => (
                            <div key={bid.id} className="border rounded-lg p-3 mb-2 hover:bg-slate-50">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{bid.contractor.name}</p>
                                    <p className="text-xs text-slate-500">{bid.contractor.company}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary text-sm">{formatRupiah(bid.price)}</p>
                                  <p className="text-xs text-slate-500">{bid.duration} hari</p>
                                </div>
                              </div>
                              {bid.contractor.rating && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs">{bid.contractor.rating}</span>
                                  <span className="text-xs text-slate-400">({bid.contractor.totalProjects} proyek)</span>
                                </div>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" className="bg-primary hover:bg-primary/90 h-7 text-xs" onClick={() => onAcceptBid(bid.id)}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Terima
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onRejectBid(bid.id)}>Tolak</Button>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter Proyek" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Proyek</SelectItem>
                        {ownerStats.projects.filter(p => p.status === 'OPEN').map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select defaultValue="newest">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Urutkan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Terbaru</SelectItem>
                        <SelectItem value="lowest">Harga Terendah</SelectItem>
                        <SelectItem value="rating">Rating Tertinggi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedBidsForCompare.length >= 2 && (
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={onShowCompare}>
                      <Scale className="h-4 w-4 mr-2" /> Bandingkan ({selectedBidsForCompare.length})
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-96">
                  {ownerStats.projects.filter(p => p.bids.length > 0).flatMap(p => p.bids).length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>Belum ada penawaran masuk</p>
                    </div>
                  ) : (
                    ownerStats.projects.filter(p => p.bids.length > 0 && p.status === 'OPEN').flatMap(project =>
                      project.bids.map(bid => {
                        const projectData = ownerStats.projects.find(p => p.bids.some(b => b.id === bid.id));
                        const matchScore = calculateMatchScore(
                          bid.contractor as unknown as Contractor,
                          projectData?.category || '',
                          projectData?.budget || 0
                        );
                        return (
                          <div key={bid.id} className={`border rounded-lg p-4 mb-3 hover:shadow-sm ${selectedBidsForCompare.includes(bid.id) ? 'border-purple-400 bg-purple-50' : ''}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-slate-300 accent-purple-600"
                                  checked={selectedBidsForCompare.includes(bid.id)}
                                  onChange={() => toggleBidSelection(bid.id)}
                                  disabled={!selectedBidsForCompare.includes(bid.id) && selectedBidsForCompare.length >= 3}
                                />
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                  <p className="font-medium">{bid.contractor.name}</p>
                                  <p className="text-sm text-slate-500">{bid.contractor.company}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-primary">{formatRupiah(bid.price)}</p>
                                <p className="text-sm text-slate-500">{bid.duration} hari kerja</p>
                              </div>
                            </div>
                            {bid.contractor.rating && (
                              <div className="flex items-center gap-4 mb-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-medium">{bid.contractor.rating}</span>
                                  <span className="text-sm text-slate-500">({bid.contractor.totalProjects} proyek)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Zap className="h-4 w-4 text-purple-500" />
                                  <span className="text-sm font-medium text-purple-600">{matchScore}% Cocok</span>
                                </div>
                              </div>
                            )}
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{bid.proposal}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-slate-400">Untuk: {projectData?.title}</p>
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => onAcceptBid(bid.id)}>
                                  <CheckCircle className="h-4 w-4 mr-1" /> Terima
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => onRejectBid(bid.id)}>Tolak</Button>
                                <Button size="sm" variant="ghost" onClick={() => onAddFavorite(bid.contractor.id)}>
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <Card>
              <CardContent className="p-6">
                {!favorites || favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 mb-4">Belum ada kontraktor favorit</p>
                    <p className="text-sm text-slate-400">Tambahkan kontraktor ke favorit dari daftar penawaran</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {favorites.map((fav) => (
                      <Card key={fav.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">{fav.contractor.name}</p>
                                <p className="text-sm text-slate-500">{fav.contractor.company?.name}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => onRemoveFavorite(fav.id)}>
                              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                            </Button>
                          </div>
                          {fav.contractor.company && (
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm">{fav.contractor.company.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-500">{fav.contractor.company.totalProjects} proyek</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-primary" />
                  Timeline Proyek
                </CardTitle>
                <CardDescription>Pantau progress dan milestone semua proyek Anda</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {ownerStats.projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED').length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Tidak ada proyek yang sedang berjalan atau selesai</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ownerStats.projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED').map((project) => (
                      <Card key={project.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={project.status === 'IN_PROGRESS' ? 'bg-blue-600' : 'bg-primary'}>
                                  {project.status === 'IN_PROGRESS' ? 'Sedang Berjalan' : 'Selesai'}
                                </Badge>
                                <Badge variant="outline">{project.category}</Badge>
                              </div>
                              <h3 className="font-semibold text-lg">{project.title}</h3>
                              <p className="text-sm text-slate-500">{project.location} • {formatRupiah(project.budget)}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onShowProgress({ id: project.id, title: project.title, category: project.category, budget: project.budget });
                                loadMilestones(project.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" /> Detail
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-slate-600">Progress</span>
                                <span className="font-medium text-primary">65%</span>
                              </div>
                              <Progress value={65} className="h-2" />
                            </div>
                            <div className="text-sm text-slate-500">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Est. 90 hari
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Dokumen Proyek
                    </CardTitle>
                    <CardDescription>Kelola semua dokumen proyek Anda</CardDescription>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setWebcamModalOpen(true)}>
                    <Camera className="h-4 w-4 mr-2" /> Foto & Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Select value={filterDocType} onValueChange={setFilterDocType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="KONTRAK">Kontrak</SelectItem>
                      <SelectItem value="GAMBAR">Gambar Teknis</SelectItem>
                      <SelectItem value="INVOICE">Invoice</SelectItem>
                      <SelectItem value="SPK">SPK</SelectItem>
                      <SelectItem value="RAB">RAB</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDocProject} onValueChange={setFilterDocProject}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter Proyek" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Proyek</SelectItem>
                      {ownerStats.projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Belum ada dokumen</p>
                    <p className="text-sm text-slate-400">Dokumen proyek akan muncul di sini setelah diunggah</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            doc.type === 'KONTRAK' ? 'bg-blue-100' :
                            doc.type === 'GAMBAR' ? 'bg-purple-100' :
                            doc.type === 'INVOICE' ? 'bg-yellow-100' :
                            doc.type === 'SPK' ? 'bg-orange-100' : 'bg-slate-100'
                          }`}>
                            <FileText className={`h-5 w-5 ${
                              doc.type === 'KONTRAK' ? 'text-blue-600' :
                              doc.type === 'GAMBAR' ? 'text-purple-600' :
                              doc.type === 'INVOICE' ? 'text-yellow-600' :
                              doc.type === 'SPK' ? 'text-orange-600' : 'text-slate-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-slate-500">{doc.project} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-slate-500">{new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            {doc.isApproved ? (
                              <Badge className="bg-primary/10 text-primary text-xs">Disetujui</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pending</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => toast.success('Membuka dokumen...')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toast.success('Mengunduh dokumen...')}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Anggaran</p>
                      <p className="text-2xl font-bold text-slate-800">{formatRupiah(paymentSummary?.totalBudget || 0)}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Sudah Dibayar</p>
                      <p className="text-2xl font-bold text-primary">{formatRupiah(paymentSummary?.totalPaid || 0)}</p>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Sisa Pembayaran</p>
                      <p className="text-2xl font-bold text-yellow-600">{formatRupiah(paymentSummary?.totalPending || 0)}</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Riwayat Pembayaran
                    </CardTitle>
                    <CardDescription>Tracking pembayaran milestone proyek</CardDescription>
                  </div>
                  <Button variant="outline" onClick={onShowExport}>
                    <Download className="h-4 w-4 mr-2" /> Export Laporan
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Belum ada riwayat pembayaran</p>
                    <p className="text-sm text-slate-400">Pembayaran akan muncul setelah milestone dibuat dan dibayar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payment.status === 'CONFIRMED' ? 'bg-primary/10' : 'bg-yellow-100'
                          }`}>
                            {payment.status === 'CONFIRMED' ? (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{payment.milestone || 'Pembayaran Milestone'}</p>
                            <p className="text-sm text-slate-500">{payment.project || 'Proyek'}</p>
                            <p className="text-xs text-slate-400">{payment.method || 'Transfer Bank'} • {payment.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${payment.status === 'CONFIRMED' ? 'text-primary' : 'text-yellow-600'}`}>
                            {formatRupiah(payment.amount)}
                          </p>
                          <Badge className={payment.status === 'CONFIRMED' ? 'bg-primary/10 text-primary' : 'bg-yellow-100 text-yellow-700'}>
                            {payment.status === 'CONFIRMED' ? 'Lunas' : 'Menunggu'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Webcam Upload Modal */}
      <WebcamUploadModal
        open={webcamModalOpen}
        onOpenChange={setWebcamModalOpen}
        onUpload={handleDocumentUpload}
        projects={ownerStats.projects}
      />
    </div>
  );
}
