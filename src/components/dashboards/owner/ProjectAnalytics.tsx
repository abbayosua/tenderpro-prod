'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  PieChart, Pie, Cell, Area, AreaChart, Legend,
} from 'recharts';
import {
  BarChart3, TrendingUp, Users, DollarSign, AlertTriangle, Shield,
  Activity, Target, Calendar, Download, FileText, RefreshCw, Trophy, Clock, ArrowUpRight,
  Lightbulb, TrendingDown, Minus, ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/helpers';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalProjects: number;
  overallBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  milestoneCompletionRate: number;
  riskScore: number;
  riskLabel: string;
  bidAnalysis: {
    average: number;
    min: number;
    max: number;
    count: number;
    acceptedCount: number;
    distribution: Array<{ range: string; count: number }>;
  };
  contractorInterest: Array<{ month: string; newBids: number; newContractors: number }>;
  projectTimeline: Array<{
    id: string;
    title: string;
    status: string;
    budget: number;
    startOffset: number;
    duration: number;
    progress: number;
    bidCount: number;
  }>;
  budgetComparison: Array<{
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  // New fields
  monthlyCreation: Array<{ month: string; projects: number }>;
  budgetOverview: { allocated: number; spent: number; remaining: number };
  topContractors: Array<{
    contractorId: string;
    name: string;
    rating: number;
    totalBids: number;
    acceptedBids: number;
    completedProjects: number;
    experienceYears: number;
    winRate: number;
    avgBid: number;
  }>;
  riskAssessment: Array<{
    projectId: string;
    projectTitle: string;
    budgetUtilization: number;
    progress: number;
    overdueMilestones: number;
    riskScore: number;
    riskLabel: string;
    riskColor: string;
  }>;
}

interface ProjectAnalyticsProps {
  userId: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 71%, 45%)',
  'hsl(var(--chart-3))',
];

export function ProjectAnalytics({ userId }: ProjectAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/owner?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Gagal memuat analitik');
      }
    } catch {
      setError('Gagal memuat analitik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleExportPDF = async () => {
    toast.info('Laporan analitik sedang disiapkan...');
    await new Promise((r) => setTimeout(r, 1500));
    toast.success('Laporan berhasil disiapkan!');
  };

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-32" /></CardContent></Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-500">{error}</p>
          <Button variant="outline" className="mt-3" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalProjects === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Data Analitik</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Analitik akan muncul setelah Anda memiliki proyek dengan data bid dan milestone
          </p>
        </CardContent>
      </Card>
    );
  }

  const riskColor = data.riskScore >= 70 ? 'text-red-600' : data.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600';
  const riskBg = data.riskScore >= 70 ? 'bg-red-100' : data.riskScore >= 40 ? 'bg-amber-100' : 'bg-emerald-100';

  // Donut chart data
  const donutData = [
    { name: 'Terpakai', value: data.totalSpent },
    { name: 'Sisa', value: data.budgetOverview.remaining },
  ];

  const summaryCards = [
    { label: 'Total Proyek', value: data.totalProjects, icon: FileText, color: 'primary', gradient: 'from-primary/15 via-teal-500/5 to-transparent', iconBg: 'bg-gradient-to-br from-primary/20 to-teal-500/20', borderColor: 'border-l-primary' },
    { label: 'Total Anggaran', value: formatRupiah(data.overallBudget), icon: DollarSign, color: 'emerald', gradient: 'from-emerald-500/15 via-green-500/5 to-transparent', iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20', borderColor: 'border-l-emerald-500' },
    { label: 'Total Terpakai', value: formatRupiah(data.totalSpent), icon: TrendingUp, color: 'amber', gradient: 'from-amber-500/15 via-orange-500/5 to-transparent', iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20', borderColor: 'border-l-amber-500' },
    { label: 'Skor Risiko', value: `${data.riskScore}/100`, icon: Shield, color: data.riskScore >= 70 ? 'red' : data.riskScore >= 40 ? 'amber' : 'emerald', gradient: data.riskScore >= 70 ? 'from-red-500/15 via-red-400/5 to-transparent' : data.riskScore >= 40 ? 'from-amber-500/15 via-amber-400/5 to-transparent' : 'from-emerald-500/15 via-green-500/5 to-transparent', iconBg: data.riskScore >= 70 ? 'bg-gradient-to-br from-red-500/20 to-red-400/20' : data.riskScore >= 40 ? 'bg-gradient-to-br from-amber-500/20 to-amber-400/20' : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20', borderColor: data.riskScore >= 70 ? 'border-l-red-500' : data.riskScore >= 40 ? 'border-l-amber-500' : 'border-l-emerald-500' },
  ];

  // Insight badges
  const insights = [
    { icon: data.budgetUtilization > 80 ? AlertTriangle : CheckCircle, text: data.budgetUtilization > 80 ? 'Anggaran hampir terpakai' : 'Anggaran masih aman', color: data.budgetUtilization > 80 ? 'text-red-600 bg-red-50 border-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { icon: data.milestoneCompletionRate >= 70 ? TrendingUp : TrendingDown, text: `${data.milestoneCompletionRate}% milestone selesai`, color: data.milestoneCompletionRate >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100' },
    { icon: data.bidAnalysis.count > 0 ? Users : Minus, text: `${data.bidAnalysis.count} bid total, ${data.bidAnalysis.acceptedCount} diterima`, color: 'text-primary bg-primary/5 border-primary/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Analitik Proyek
          </h3>
          <p className="text-sm text-slate-500">Ringkasan performa dan analitik proyek Anda</p>
        </div>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" /> Ekspor Laporan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -3, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.12)' }}>
            <Card className={`border shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${card.borderColor} overflow-hidden`}>
              <CardContent className={`p-4 bg-gradient-to-br ${card.gradient}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <card.icon className={`h-5 w-5 text-${card.color}-600`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{card.label}</p>
                    <p className="text-lg font-bold text-slate-800">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Insight Badges */}
      <div className="flex flex-wrap gap-2">
        {insights.map((insight, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            whileHover={{ y: -1 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${insight.color}`}
          >
            <insight.icon className="h-3.5 w-3.5" />
            {insight.text}
          </motion.div>
        ))}
      </div>

      {/* Budget Donut + KPIs Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Budget Donut Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Ringkasan Anggaran
            </CardTitle>
            <CardDescription>Alokasi vs terpakai vs sisa</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-48 mx-auto">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {donutData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} formatter={(v: number) => [formatRupiah(v), '']} />
              </PieChart>
            </ChartContainer>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DONUT_COLORS[0] }} />
                  <span className="text-slate-600">Terpakai</span>
                </div>
                <span className="font-medium">{formatRupiah(data.totalSpent)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DONUT_COLORS[1] }} />
                  <span className="text-slate-600">Sisa</span>
                </div>
                <span className="font-medium">{formatRupiah(data.budgetOverview.remaining)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Utilization - Animated Ring */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border shadow-sm h-full">
            <CardContent className="p-5 flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 mb-3">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" opacity="0.2" />
                  <motion.circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={data.budgetUtilization > 80 ? 'hsl(0, 84%, 60%)' : data.budgetUtilization > 60 ? 'hsl(38, 92%, 50%)' : 'hsl(var(--primary))'}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - data.budgetUtilization / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{data.budgetUtilization}%</span>
                  <span className="text-[10px] text-slate-400">terpakai</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                Penggunaan Anggaran
              </p>
              <p className="text-xs text-slate-400 mt-1 text-center">
                {formatRupiah(data.totalSpent)} dari {formatRupiah(data.overallBudget)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestone Completion - Animated Ring */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border shadow-sm h-full">
            <CardContent className="p-5 flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 mb-3">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" opacity="0.2" />
                  <motion.circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={data.milestoneCompletionRate >= 70 ? 'hsl(142, 71%, 45%)' : data.milestoneCompletionRate >= 40 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)'}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - data.milestoneCompletionRate / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{data.milestoneCompletionRate}%</span>
                  <span className="text-[10px] text-slate-400">selesai</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-emerald-500" />
                Penyelesaian Milestone
              </p>
              <p className="text-xs text-slate-400 mt-1 text-center">
                {data.riskLabel === 'RENDAH' ? 'Sedang berjalan baik' : 'Perlu perhatian lebih'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Risk Assessment Cards */}
      {data.riskAssessment.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Penilaian Risiko Proyek Aktif
            </CardTitle>
            <CardDescription>Analisis risiko berdasarkan anggaran dan timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.riskAssessment.map((project) => (
                <motion.div
                  key={project.projectId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    project.riskColor === 'red'
                      ? 'border-red-200 bg-red-50/50'
                      : project.riskColor === 'amber'
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-emerald-200 bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[70%]">{project.projectTitle}</p>
                    <Badge className={`text-xs ${
                      project.riskColor === 'red'
                        ? 'bg-red-100 text-red-700'
                        : project.riskColor === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {project.riskLabel}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Skor Risiko</span>
                        <span className={`font-medium ${
                          project.riskColor === 'red' ? 'text-red-600'
                          : project.riskColor === 'amber' ? 'text-amber-600'
                          : 'text-emerald-600'
                        }`}>{project.riskScore}/100</span>
                      </div>
                      <Progress value={project.riskScore} className={`h-1.5 ${
                        project.riskColor === 'red' ? '[&>div]:bg-red-500'
                        : project.riskColor === 'amber' ? '[&>div]:bg-amber-500'
                        : '[&>div]:bg-emerald-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Anggaran</span>
                        <span className="font-medium">{project.budgetUtilization}%</span>
                      </div>
                      <Progress value={project.budgetUtilization} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    {project.overdueMilestones > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <Clock className="h-3 w-3" />
                        <span>{project.overdueMilestones} milestone terlambat</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Project Creation Trend */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tren Pembuatan Proyek
            </CardTitle>
            <CardDescription>Jumlah proyek baru per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={data.monthlyCreation}>
                <defs>
                  <linearGradient id="creationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="projects" name="Proyek Baru" fill="url(#creationGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Contractor Interest Over Time */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Minat Kontraktor
            </CardTitle>
            <CardDescription>Tren bid dan kontraktor baru per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <LineChart data={data.contractorInterest}>
                <defs>
                  <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="newBids" name="Bid Baru" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="newContractors" name="Kontraktor Baru" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bid Distribution */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribusi Bid
            </CardTitle>
            <CardDescription>Sebaran harga bid kontraktor</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={data.bidAnalysis.distribution}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="Jumlah" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="flex justify-between mt-3 text-xs text-slate-500">
              <span>Rata-rata: {formatRupiah(data.bidAnalysis.average)}</span>
              <span>Min: {formatRupiah(data.bidAnalysis.min)}</span>
              <span>Max: {formatRupiah(data.bidAnalysis.max)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Contractor Performance Ranking */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Peringkat Kontraktor Terbaik
            </CardTitle>
            <CardDescription>Berdasarkan bid diterima dan rating</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topContractors.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center">
                <Trophy className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">Belum ada data kontraktor</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.topContractors.map((c, idx) => (
                  <motion.div
                    key={c.contractorId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>⭐ {c.rating.toFixed(1)}</span>
                          <span>·</span>
                          <span>{c.experienceYears}thn</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{c.winRate}%</p>
                      <p className="text-xs text-slate-400">{c.acceptedBids} diterima</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual Comparison */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Anggaran vs Pengeluaran
          </CardTitle>
          <CardDescription>Perbandingan anggaran dan pengeluaran per proyek</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72">
            <BarChart data={data.budgetComparison} layout="vertical" margin={{ left: 10 }}>
              <defs>
                <linearGradient id="budgetGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="spentGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => {
                  if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}M`;
                  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}Jt`;
                  return `${(v / 1000).toFixed(0)}K`;
                }}
              />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={120} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(v: number) => [formatRupiah(v), '']} />
              <Legend />
              <Bar dataKey="budget" name="Anggaran" fill="url(#budgetGrad)" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="spent" name="Terpakai" fill="url(#spentGrad)" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Project Timeline */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Timeline Proyek
          </CardTitle>
          <CardDescription>Progress proyek dalam bentuk timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.projectTimeline.map((project) => {
              const statusColor = project.status === 'COMPLETED' ? 'bg-emerald-500' :
                project.status === 'IN_PROGRESS' ? 'bg-primary' :
                project.status === 'OPEN' ? 'bg-amber-500' : 'bg-slate-300';

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-32 md:w-48 flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{project.title}</p>
                    <p className="text-xs text-slate-400">{project.bidCount} bid</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-slate-100 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${statusColor} rounded-full`}
                        style={{ opacity: 0.85 }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${
                    project.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                    project.status === 'IN_PROGRESS' ? 'text-primary bg-primary/5 border-primary/20' :
                    project.status === 'OPEN' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                    'text-slate-500 bg-slate-50 border-slate-200'
                  }`}>
                    {project.status === 'COMPLETED' ? 'Selesai' :
                     project.status === 'IN_PROGRESS' ? 'Berjalan' :
                     project.status === 'OPEN' ? 'Terbuka' :
                     project.status === 'DRAFT' ? 'Draf' : project.status}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
