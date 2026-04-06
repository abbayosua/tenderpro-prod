'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer } from '@/components/ui/chart';
import {
  ChartTooltip, ChartTooltipContent, type ChartConfig
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import {
  Building2, Star, MapPin, Clock, Briefcase, CheckCircle, TrendingUp,
  FileText, Upload, Plus, Search, MessageSquare, FolderOpen, LogOut,
  X, Edit, Trash2, DollarSign, TrendingDown, Minus, RefreshCw,
  Sparkles, Zap, Shield, Target, Award, ChevronDown, ChevronUp, ChevronRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ContractorStats, Project } from '@/types';
import { formatRupiah } from '@/lib/helpers';
import { SimpleStatsCard } from '@/components/shared/StatsCard';
import { VerificationAlert } from '@/components/shared/VerificationAlert';
import { PortfolioModal } from '@/components/modals/PortfolioModal';
import { ChatModal } from '@/components/modals/ChatModal';
import type { ContractorChartData, RefreshInterval } from '@/hooks/useDashboard';

interface Portfolio {
  id: string;
  title: string;
  description: string;
  category: string;
  clientName?: string;
  location?: string;
  year: number;
  budget?: number;
  images: string[];
  createdAt: Date;
}

interface AIRecommendation {
  suggestedPrice: string;
  suggestedDuration: string;
  proposalTemplate: string;
  keyPoints: string[];
}

interface ContractorDashboardProps {
  user: { id: string; name: string; verificationStatus: string };
  contractorStats: ContractorStats;
  contractorChartData?: ContractorChartData | null;
  onLogout: () => void;
  onShowVerification: () => void;
  onShowBidModal: (project: Project, prefillData?: { proposal: string; price: string; duration: string }) => void;
  // Auto-refresh props
  refreshInterval?: RefreshInterval;
  onSetRefreshInterval?: (interval: RefreshInterval) => void;
  lastRefreshed?: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function ContractorDashboard({
  user,
  contractorStats,
  contractorChartData,
  onLogout,
  onShowVerification,
  onShowBidModal,
  // Auto-refresh props
  refreshInterval = '1m',
  onSetRefreshInterval,
  lastRefreshed,
  isRefreshing = false,
  onRefresh,
}: ContractorDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [withdrawConfirmBid, setWithdrawConfirmBid] = useState<{ id: string; title: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // AI Bid Assistant state
  const [aiLoading, setAiLoading] = useState<string | null>(null); // project ID being loaded
  const [aiRecommendation, setAiRecommendation] = useState<Record<string, AIRecommendation>>({});
  const [expandedAiCard, setExpandedAiCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBudgetRange, setFilterBudgetRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    budget: number;
    duration?: number;
    bidCount: number;
    hasBid: boolean;
    owner: { name: string; company?: string };
    description: string;
  }>>([]);

  // Chart configuration for contractor performance
  const chartConfig: ChartConfig = {
    accepted: { label: 'Diterima', color: 'hsl(var(--chart-4))' },
    rejected: { label: 'Ditolak', color: 'hsl(var(--destructive))' },
    pending: { label: 'Pending', color: 'hsl(var(--chart-5))' },
    winRate: { label: 'Win Rate (%)', color: 'hsl(var(--primary))' },
    total: { label: 'Total Penawaran', color: 'hsl(var(--primary))' },
  };

  const CHART_COLORS = [
    'hsl(var(--chart-4))', // accepted - green-ish
    'hsl(var(--destructive))', // rejected - red
    'hsl(var(--chart-5))', // pending - yellow
  ];

  // Memoize chart data transformations
  const bidStatusData = useMemo(() => {
    if (!contractorChartData) {
      return [
        { name: 'Diterima', value: 0, fill: CHART_COLORS[0] },
        { name: 'Ditolak', value: 0, fill: CHART_COLORS[1] },
        { name: 'Pending', value: 0, fill: CHART_COLORS[2] },
      ];
    }
    return [
      { name: 'Diterima', value: contractorChartData.acceptedBids, fill: CHART_COLORS[0] },
      { name: 'Ditolak', value: contractorChartData.rejectedBids, fill: CHART_COLORS[1] },
      { name: 'Pending', value: contractorChartData.pendingBids, fill: CHART_COLORS[2] },
    ];
  }, [contractorChartData]);

  const monthlyBidData = useMemo(() => {
    if (!contractorChartData?.monthlyBidSubmissions) {
      return [];
    }
    return contractorChartData.monthlyBidSubmissions;
  }, [contractorChartData]);

  const winRateHistoryData = useMemo(() => {
    if (!contractorChartData?.winRateHistory) {
      return [];
    }
    return contractorChartData.winRateHistory;
  }, [contractorChartData]);

  const performanceData = useMemo(() => {
    if (!contractorChartData?.performanceComparison) {
      return null;
    }
    return contractorChartData.performanceComparison;
  }, [contractorChartData]);

  const winRateTrend = useMemo(() => {
    return contractorChartData?.winRateTrend || { direction: 'stable', value: 0, current: 0, previous: 0 };
  }, [contractorChartData]);

  // Helper function to format last refreshed time
  const formatLastRefreshed = (date: Date | null | undefined): string => {
    if (!date) return 'Belum ada data';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} detik lalu`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} menit lalu`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} jam lalu`;
    }
  };

  // Load portfolios
  const loadPortfolios = useCallback(async () => {
    setLoadingPortfolios(true);
    try {
      const res = await fetch(`/api/portfolios?userId=${user.id}`);
      const data = await res.json();
      if (data.portfolios) {
        setPortfolios(data.portfolios);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    } finally {
      setLoadingPortfolios(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  // Handle add portfolio
  const handleAddPortfolio = () => {
    setSelectedPortfolio(null);
    setPortfolioModalOpen(true);
  };

  // Handle edit portfolio
  const handleEditPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setPortfolioModalOpen(true);
  };

  // Handle delete portfolio
  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      const res = await fetch(`/api/portfolios?id=${portfolioId}&userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Portofolio dihapus');
        setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
        setDeleteConfirmId(null);
      } else {
        toast.error(data.error || 'Gagal menghapus portofolio');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  // Handle portfolio success
  const handlePortfolioSuccess = () => {
    loadPortfolios();
  };

  // Handle bid withdrawal
  const handleWithdrawBid = async (bidId: string) => {
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/bids?id=${bidId}&contractorId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Penawaran berhasil dibatalkan');
        setWithdrawConfirmBid(null);
        // Refresh the page to update the bids list
        window.location.reload();
      } else {
        toast.error(data.error || 'Gagal membatalkan penawaran');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setWithdrawing(false);
    }
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
            {/* Refresh Controls */}
            <div className="flex items-center gap-2 mr-2">
              {/* Last refreshed indicator */}
              <span className="text-xs text-slate-500 hidden sm:inline">
                Diperbarui: {formatLastRefreshed(lastRefreshed)}
              </span>
              
              {/* Refresh interval selector */}
              <Select
                value={refreshInterval}
                onValueChange={(value) => onSetRefreshInterval?.(value as RefreshInterval)}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30s">30s</SelectItem>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Manual refresh button */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRefresh?.()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => setChatModalOpen(true)}>
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-slate-500">Kontraktor</p>
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
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <SimpleStatsCard label="Total Penawaran" value={contractorStats.totalBids} icon={FileText} color="primary" />
          <SimpleStatsCard label="Diterima" value={contractorStats.acceptedBids} icon={CheckCircle} color="primary" />
          <SimpleStatsCard label="Pending" value={contractorStats.pendingBids} icon={Clock} color="yellow" />
          <SimpleStatsCard label="Win Rate" value={`${contractorStats.winRate}%`} icon={TrendingUp} color="purple" />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {
            const tenderTab = document.querySelector('[value="tender"]') as HTMLButtonElement;
            if (tenderTab) tenderTab.click();
          }}>
            <Search className="h-4 w-4 mr-2" /> Cari Proyek
          </Button>
          <Button variant="outline" onClick={onShowVerification}>
            <Upload className="h-4 w-4 mr-2" /> Verifikasi Akun
          </Button>
        </div>

        {/* Performance Charts Section */}
        {contractorChartData && (
          <>
            {/* Win Rate Trend Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {winRateTrend.direction === 'up' ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : winRateTrend.direction === 'down' ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <Minus className="h-5 w-5 text-slate-400" />
                      )}
                      Tren Win Rate
                    </CardTitle>
                    <CardDescription>
                      Perbandingan win rate 3 bulan terakhir vs 3 bulan sebelumnya
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${
                        winRateTrend.direction === 'up' ? 'text-green-500' : 
                        winRateTrend.direction === 'down' ? 'text-red-500' : 'text-slate-600'
                      }`}>
                        {winRateTrend.current}%
                      </span>
                      {winRateTrend.direction !== 'stable' && (
                        <Badge variant={winRateTrend.direction === 'up' ? 'default' : 'destructive'} className="text-xs">
                          {winRateTrend.direction === 'up' ? '+' : ''}{winRateTrend.value}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">dari {winRateTrend.previous}% sebelumnya</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Win Rate History Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Riwayat Win Rate</CardTitle>
                  <CardDescription>Win rate bulanan dalam 6 bulan terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <LineChart data={winRateHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="winRate"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                        name="winRate"
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Bid Status Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribusi Status Penawaran</CardTitle>
                  <CardDescription>Total penawaran berdasarkan status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <PieChart>
                      <Pie
                        data={bidStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {bidStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Bid Submissions Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Penawaran Bulanan</CardTitle>
                <CardDescription>Jumlah penawaran yang diajukan per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <BarChart data={monthlyBidData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="accepted" name="Diterima" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Ditolak" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Performance Comparison Cards */}
            {performanceData && (
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Diterima</p>
                        <p className="text-xl font-bold text-green-600">{performanceData.accepted}</p>
                        <p className="text-xs text-slate-400">{performanceData.acceptanceRate}% rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <X className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Ditolak</p>
                        <p className="text-xl font-bold text-red-600">{performanceData.rejected}</p>
                        <p className="text-xs text-slate-400">{performanceData.rejectionRate}% rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Pending</p>
                        <p className="text-xl font-bold text-yellow-600">{performanceData.pending}</p>
                        <p className="text-xs text-slate-400">Menunggu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Win Rate</p>
                        <p className="text-xl font-bold text-primary">{contractorChartData.overallWinRate}%</p>
                        <p className="text-xs text-slate-400">Keseluruhan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="tender" className="w-full">
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="tender"><Search className="h-4 w-4 mr-2" /> Cari Proyek</TabsTrigger>
            <TabsTrigger value="bids"><FileText className="h-4 w-4 mr-2" /> Penawaran Saya</TabsTrigger>
            <TabsTrigger value="portfolio"><FolderOpen className="h-4 w-4 mr-2" /> Portofolio</TabsTrigger>
          </TabsList>

          {/* Cari Proyek (Find Projects) Tab */}
          <TabsContent value="tender">
            {/* Search & Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Cari proyek berdasarkan nama, deskripsi, atau lokasi..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="Pembangunan Baru">Pembangunan Baru</SelectItem>
                      <SelectItem value="Renovasi">Renovasi</SelectItem>
                      <SelectItem value="Interior">Interior</SelectItem>
                      <SelectItem value="Konstruksi">Konstruksi</SelectItem>
                      <SelectItem value="MEP">MEP</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBudgetRange} onValueChange={(v) => setFilterBudgetRange(v as 'all' | 'low' | 'mid' | 'high')}>
                    <SelectTrigger className="w-full md:w-44">
                      <SelectValue placeholder="Semua Budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Budget</SelectItem>
                      <SelectItem value="low">&lt; 100 Juta</SelectItem>
                      <SelectItem value="mid">100-500 Juta</SelectItem>
                      <SelectItem value="high">&gt; 500 Juta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="bg-primary hover:bg-primary/90 whitespace-nowrap"
                    onClick={async () => {
                      try {
                        const body: Record<string, unknown> = {};
                        if (searchQuery.trim()) body.query = searchQuery.trim();
                        if (filterCategory && filterCategory !== 'all') body.categories = [filterCategory];
                        if (filterBudgetRange !== 'all') {
                          if (filterBudgetRange === 'low') { body.budgetMax = 100000000; }
                          else if (filterBudgetRange === 'mid') { body.budgetMin = 100000000; body.budgetMax = 500000000; }
                          else { body.budgetMin = 500000000; }
                        }
                        body.sortBy = 'newest';
                        body.page = 1;
                        body.limit = 20;
                        const res = await fetch('/api/projects/search', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setSearchResults(data.projects || []);
                        }
                      } catch { toast.error('Gagal mencari proyek'); }
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" /> Cari
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Projects List with AI Bid Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Proyek Tersedia dengan AI Bid Assistant
                </CardTitle>
                <CardDescription>
                  Temukan proyek yang sesuai dan dapatkan rekomendasi penawaran dari AI untuk meningkatkan peluang menang
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {searchResults.length === 0 && contractorStats.availableProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Tidak ada proyek tersedia saat ini</p>
                    <p className="text-sm text-slate-400">Gunakan filter di atas untuk mencari proyek atau coba lagi nanti</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {(searchResults.length > 0 ? searchResults : contractorStats.availableProjects).map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-base">{project.title}</h4>
                              {project.hasBid && (
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">Sudah Bid</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.location}</span>
                              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {project.category}</span>
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              <span className="font-medium text-primary">{formatRupiah(project.budget)}</span>
                              {project.duration && <span className="ml-3"><Clock className="h-3 w-3 inline mr-1" />{project.duration} hari</span>}
                              <span className="ml-3">{project.bidCount} penawaran</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Pemilik: {project.owner.name}{project.owner.company ? ` (${project.owner.company})` : ''}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-primary border-primary hover:bg-primary/5"
                              disabled={!!aiLoading}
                              onClick={async () => {
                                setAiLoading(project.id);
                                try {
                                  const res = await fetch('/api/ai/bid-assistant', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      projectId: project.id,
                                      contractorId: user.id,
                                      projectBudget: project.budget,
                                      projectDescription: project.description || project.title,
                                      projectRequirements: project.category,
                                      contractorExperience: 3,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (data.success && data.recommendation) {
                                    setAiRecommendation(prev => ({ ...prev, [project.id]: data.recommendation }));
                                    setExpandedAiCard(project.id);
                                    toast.success('Rekomendasi AI berhasil didapatkan!');
                                  } else {
                                    toast.error(data.error || 'Gagal mendapatkan rekomendasi AI');
                                  }
                                } catch {
                                  toast.error('Gagal mendapatkan rekomendasi AI. Silakan coba lagi.');
                                } finally {
                                  setAiLoading(null);
                                }
                              }}
                            >
                              {aiLoading === project.id ? (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Memproses...</>
                              ) : aiRecommendation[project.id] ? (
                                <><Sparkles className="h-3 w-3 mr-1" /> Lihat Rekomendasi</>
                              ) : (
                                <><Sparkles className="h-3 w-3 mr-1" /> AI Rekomendasi</>
                              )}
                            </Button>
                            {!project.hasBid && (
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => onShowBidModal(project as unknown as Project)}
                              >
                                <FileText className="h-3 w-3 mr-1" /> Ajukan Bid
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* AI Recommendation Card */}
                        {aiRecommendation[project.id] && expandedAiCard === project.id && (
                          <div className="mt-3 border border-primary/20 rounded-lg bg-gradient-to-r from-primary/5 to-purple-50 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <h5 className="font-semibold text-sm text-primary">Rekomendasi AI Bid Assistant</h5>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setExpandedAiCard(prev => prev === project.id ? null : project.id)}
                              >
                                {expandedAiCard === project.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-white/80 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Harga yang Disarankan</p>
                                <p className="font-bold text-green-600 text-sm">{aiRecommendation[project.id].suggestedPrice}</p>
                              </div>
                              <div className="bg-white/80 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Durasi yang Disarankan</p>
                                <p className="font-bold text-blue-600 text-sm">{aiRecommendation[project.id].suggestedDuration}</p>
                              </div>
                            </div>

                            {/* Key Points */}
                            <div className="mb-3">
                              <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                <Target className="h-3 w-3" /> Poin Keunggulan Kontraktor Indonesia
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                {aiRecommendation[project.id].keyPoints.slice(0, 4).map((point, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                    <Zap className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <span>{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Proposal Template */}
                            <div className="mb-3">
                              <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Template Proposal
                              </p>
                              <div className="bg-white/80 rounded-lg p-3 max-h-40 overflow-y-auto">
                                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                  {aiRecommendation[project.id].proposalTemplate}
                                </p>
                              </div>
                            </div>

                            {/* Tips */}
                            {aiRecommendation[project.id].keyPoints.length > 4 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                  <Award className="h-3 w-3" /> Tips Tambahan
                                </p>
                                <div className="space-y-1">
                                  {aiRecommendation[project.id].keyPoints.slice(4).map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-500">
                                      <ChevronRight className="h-3 w-3 flex-shrink-0 mt-0.5 text-primary" />
                                      <span>{point}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Use This Proposal Button */}
                            {!project.hasBid && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 w-full"
                                onClick={() => {
                                  const rec = aiRecommendation[project.id];
                                  // Parse suggested price to extract a middle value
                                  const priceStr = rec.suggestedPrice.replace(/[^0-9]/g, '');
                                  const priceValue = priceStr ? parseInt(priceStr) : Math.round(project.budget * 0.9);
                                  const durationStr = rec.suggestedDuration.match(/\d+/);
                                  const durationValue = durationStr ? durationStr[0] : '30';

                                  onShowBidModal(project as unknown as Project, {
                                    proposal: rec.proposalTemplate,
                                    price: String(priceValue),
                                    duration: durationValue,
                                  });
                                }}
                              >
                                <Sparkles className="h-3 w-3 mr-2" />
                                Gunakan Proposal AI ini
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Collapsed AI indicator */}
                        {aiRecommendation[project.id] && expandedAiCard !== project.id && (
                          <div
                            className="mt-2 border border-primary/20 rounded-lg bg-primary/5 p-2 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => setExpandedAiCard(project.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-xs text-primary font-medium">Rekomendasi AI tersedia</span>
                            </div>
                            <ChevronDown className="h-3 w-3 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Penawaran Saya
                </CardTitle>
                <CardDescription>Kelola penawaran proyek yang telah Anda ajukan</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {contractorStats.recentBids.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Belum ada penawaran</p>
                    <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                      const tenderTab = document.querySelector('[value="tender"]') as HTMLButtonElement;
                      if (tenderTab) tenderTab.click();
                    }}>
                      <Search className="h-4 w-4 mr-2" /> Cari Proyek
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contractorStats.recentBids.map((bid) => (
                      <div key={bid.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{bid.project?.title || 'Proyek'}</h4>
                            <p className="text-sm text-slate-500">{bid.project?.location || '-'}</p>
                          </div>
                          <Badge className={bid.status === 'ACCEPTED' ? 'bg-green-500' : bid.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'}>
                            {bid.status === 'ACCEPTED' ? 'Diterima' : bid.status === 'REJECTED' ? 'Ditolak' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span><DollarSign className="h-3 w-3 inline mr-1" />{formatRupiah(bid.price)}</span>
                          <span><Clock className="h-3 w-3 inline mr-1" />{bid.duration} hari</span>
                        </div>
                        {/* Withdraw button for PENDING bids */}
                        {bid.status === 'PENDING' && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setWithdrawConfirmBid({ id: bid.id, title: bid.project?.title || 'Proyek' })}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Batalkan Penawaran
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Portofolio Proyek
                    </CardTitle>
                    <CardDescription>Tampilkan hasil kerja Anda untuk menarik klien</CardDescription>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90" onClick={handleAddPortfolio}>
                    <Plus className="h-4 w-4 mr-2" /> Tambah Portofolio
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingPortfolios ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-500 mt-4">Memuat portofolio...</p>
                  </div>
                ) : portfolios.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Belum ada portofolio</p>
                    <p className="text-sm text-slate-400 mb-4">Tambahkan portofolio untuk menarik klien potensial</p>
                    <Button className="bg-primary hover:bg-primary/90" onClick={handleAddPortfolio}>
                      <Plus className="h-4 w-4 mr-2" /> Tambah Portofolio Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolios.map((portfolio) => (
                      <Card key={portfolio.id} className="overflow-hidden group">
                        <div className="relative h-40 bg-slate-200">
                          {portfolio.images && portfolio.images.length > 0 ? (
                            <img
                              src={portfolio.images[0]}
                              alt={portfolio.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleEditPortfolio(portfolio)}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-red-500/50"
                              onClick={() => setDeleteConfirmId(portfolio.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Hapus
                            </Button>
                          </div>
                          {/* Category Badge */}
                          <Badge className="absolute top-2 left-2 bg-primary/90">
                            {portfolio.category}
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm line-clamp-1">{portfolio.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            {portfolio.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {portfolio.location}
                              </span>
                            )}
                            <span>• {portfolio.year}</span>
                          </div>
                          {portfolio.budget && (
                            <p className="text-xs text-primary font-medium mt-1">
                              {formatRupiah(portfolio.budget)}
                            </p>
                          )}
                          {portfolio.images && portfolio.images.length > 1 && (
                            <p className="text-xs text-slate-400 mt-1">
                              +{portfolio.images.length - 1} foto lainnya
                            </p>
                          )}
                        </CardContent>

                        {/* Delete Confirmation */}
                        {deleteConfirmId === portfolio.id && (
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                            <p className="text-white text-sm text-center mb-3">
                              Hapus portofolio ini?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-white border-white hover:bg-white/20"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Batal
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDeletePortfolio(portfolio.id)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Portfolio Modal */}
      <PortfolioModal
        open={portfolioModalOpen}
        onOpenChange={setPortfolioModalOpen}
        portfolio={selectedPortfolio}
        userId={user.id}
        onSuccess={handlePortfolioSuccess}
      />

      {/* Chat Modal */}
      <ChatModal
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        currentUser={{ id: user.id, name: user.name }}
      />

      {/* Withdraw Confirmation Modal */}
      {withdrawConfirmBid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Batalkan Penawaran?</CardTitle>
              <CardDescription>
                Apakah Anda yakin ingin membatalkan penawaran untuk proyek "{withdrawConfirmBid.title}"?
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setWithdrawConfirmBid(null)}
                disabled={withdrawing}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleWithdrawBid(withdrawConfirmBid.id)}
                disabled={withdrawing}
              >
                {withdrawing ? 'Membatalkan...' : 'Ya, Batalkan'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
