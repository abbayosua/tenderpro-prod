'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Briefcase, BarChart3, ArrowUpRight, ArrowDownRight, Wallet, Clock, CheckCircle, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CircleDot, Download, MessageSquare, FileSpreadsheet, Sparkles, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatRupiah, getRelativeTime } from '@/lib/helpers';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  projectTitle: string;
  amount: number;
  status: string;
  createdAt: string;
  category: string;
}

interface CategoryEarning {
  name: string;
  value: number;
}

interface EarningsByProject {
  projectId: string;
  projectTitle: string;
  amount: number;
  status: string;
  category: string;
  acceptedAt: string;
}

interface PendingPayment {
  bidId: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  status: string;
  submittedAt: string;
}

interface EarningsData {
  totalEarnings: number;
  activeEarnings: number;
  completedEarnings: number;
  pendingEarnings: number;
  projectCount: number;
  averageEarningsPerProject: number;
  activeProjectCount: number;
  completedCount: number;
  pendingPayoutCount: number;
  monthlyEarnings: Array<{ month: string; earnings: number; projectCount: number }>;
  monthTrend: number;
  trendDirection: 'up' | 'down' | 'stable';
  currentMonthEarnings: number;
  lastMonthEarnings: number;
  earningsByCategory: CategoryEarning[];
  recentTransactions: Transaction[];
  earningsByProject: EarningsByProject[];
  pendingPayments: PendingPayment[];
}

interface EarningsOverviewProps {
  userId: string;
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142, 71%, 45%)',
];

const chartConfig: ChartConfig = {
  earnings: { label: 'Pendapatan', color: 'hsl(var(--primary))' },
};

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    startRef.current = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startRef.current + (value - startRef.current) * eased));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [value, duration]);

  return <>{formatRupiah(displayValue)}</>;
}

function MiniSparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polygon fill={`url(#spark-${color})`} points={`0,${height} ${points} ${w},${height}`} />
    </svg>
  );
}

function MonthlyTargetBar({ current, target, label }: { current: number; target: number; label: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = pct >= 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700">{pct.toFixed(0)}%</span>
          {isComplete && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
              <CheckCircle className="h-3 w-3" />
            </motion.span>
          )}
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          className={`h-full rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
              : pct >= 70
              ? 'bg-gradient-to-r from-primary to-teal-500'
              : 'bg-gradient-to-r from-amber-400 to-amber-500'
          }`}
        />
      </div>
    </div>
  );
}

function getTransactionStatus(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'PAID', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle };
    case 'PENDING':
      return { label: 'PENDING', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
    case 'REJECTED':
      return { label: 'DITOLAK', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
    case 'WITHDRAWN':
      return { label: 'DITARIK', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CircleDot };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock };
  }
}

export function EarningsOverview({ userId }: EarningsOverviewProps) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawHolder, setWithdrawHolder] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/contractor/earnings?userId=${userId}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setData(json.data);
          } else {
            setError(json.error || 'Gagal memuat data pendapatan');
          }
        }
      } catch {
        if (!cancelled) setError('Gagal memuat data pendapatan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }
    if (!withdrawBank || !withdrawAccount || !withdrawHolder) {
      toast.error('Lengkapi data bank');
      return;
    }
    setSubmittingWithdraw(true);
    try {
      const res = await fetch('/api/contractor/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          bankName: withdrawBank,
          bankAccount: withdrawAccount,
          bankHolder: withdrawHolder,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Permintaan pencairan berhasil diajukan!');
        setWithdrawOpen(false);
        setWithdrawAmount('');
        setWithdrawBank('');
        setWithdrawAccount('');
        setWithdrawHolder('');
      } else {
        toast.error(json.error || 'Gagal mengajukan pencairan');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.projectCount === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Pendapatan</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Mulai menawar proyek untuk melihat pendapatan Anda di sini
          </p>
        </CardContent>
      </Card>
    );
  }

  // Generate sparkline data from monthly earnings
  const sparklineData = data.monthlyEarnings.map(m => m.earnings);

  const summaryCards = [
    {
      label: 'Total Pendapatan',
      value: data.totalEarnings,
      icon: DollarSign,
      borderColor: 'border-l-primary',
      iconBg: 'bg-gradient-to-br from-primary/20 to-teal-500/20',
      iconText: 'text-primary',
      gradient: 'from-primary/10 via-teal-500/5 to-transparent',
      animated: true,
      sparkColor: 'hsl(var(--primary))',
      sparkData: sparklineData,
    },
    {
      label: 'Proyek Aktif',
      value: data.activeEarnings,
      subLabel: `${data.activeProjectCount} proyek`,
      icon: Briefcase,
      borderColor: 'border-l-sky-500',
      iconBg: 'bg-gradient-to-br from-sky-500/20 to-blue-500/20',
      iconText: 'text-sky-600',
      gradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
      sparkColor: '#0ea5e9',
      sparkData: data.monthlyEarnings.map(m => m.projectCount * 1000000),
    },
    {
      label: 'Selesai',
      value: data.completedEarnings,
      subLabel: `${data.completedCount} proyek`,
      icon: CheckCircle,
      borderColor: 'border-l-emerald-500',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20',
      iconText: 'text-emerald-600',
      gradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
      sparkColor: '#10b981',
      sparkData: sparklineData.map((v, i) => i % 2 === 0 ? v : v * 0.8),
    },
    {
      label: 'Pending Payout',
      value: data.pendingEarnings,
      subLabel: `${data.pendingPayoutCount} proyek`,
      icon: Clock,
      borderColor: 'border-l-amber-500',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
      iconText: 'text-amber-600',
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      sparkColor: '#f59e0b',
      sparkData: data.monthlyEarnings.map(m => m.earnings * 0.15),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            whileHover={{ y: -3, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.12)' }}
          >
            <Card className={`border-l-4 ${card.borderColor} hover:shadow-lg transition-all duration-300 overflow-hidden`}>{""}
              <CardContent className={`p-4 bg-gradient-to-br ${card.gradient}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
                    <p className="text-lg md:text-xl font-bold text-slate-900 truncate">
                      {card.animated ? (
                        <AnimatedCounter value={card.value} />
                      ) : (
                        formatRupiah(card.value as number)
                      )}
                    </p>
                    {card.subLabel && (
                      <p className="text-xs text-slate-400 mt-1">{card.subLabel}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <card.icon className={`h-5 w-5 ${card.iconText}`} />
                    </div>
                    {card.sparkData && card.sparkColor && (
                      <MiniSparkline data={card.sparkData} color={card.sparkColor} height={24} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Monthly Target Progress */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            Target Bulanan
          </CardTitle>
          <CardDescription className="text-xs">Pantau pencapaian target pendapatan Anda bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MonthlyTargetBar
              current={data.currentMonthEarnings}
              target={data.lastMonthEarnings > 0 ? data.lastMonthEarnings * 1.2 : 50000000}
              label="Target Pendapatan"
            />
            <MonthlyTargetBar
              current={data.activeProjectCount}
              target={Math.max(data.completedCount + 2, 5)}
              label="Target Proyek Aktif"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trend + Withdrawal Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trend Indicator */}
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Tren Bulan Ini</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-3xl font-bold ${
                    data.trendDirection === 'up' ? 'text-emerald-600' :
                    data.trendDirection === 'down' ? 'text-red-500' :
                    'text-slate-500'
                  }`}>
                    {data.trendDirection === 'up' ? '+' : ''}{data.monthTrend}%
                  </span>
                  {data.trendDirection === 'up' ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    </div>
                  ) : data.trendDirection === 'down' ? (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {formatRupiah(Math.abs(data.currentMonthEarnings - data.lastMonthEarnings))} dari bulan lalu
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Bulan Ini</p>
                <p className="text-lg font-bold text-slate-700">{formatRupiah(data.currentMonthEarnings)}</p>
                <p className="text-xs text-slate-400 mt-1">Bulan Lalu: {formatRupiah(data.lastMonthEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Request */}
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Saldo Tersedia</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatRupiah(data.totalEarnings)}</p>
                <p className="text-xs text-slate-400 mt-1">Rata-rata per proyek: {formatRupiah(data.averageEarningsPerProject)}</p>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => setWithdrawOpen(true)}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Cairkan Dana
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Monthly Earnings Chart - LineChart with gradient */}
        <Card className="md:col-span-2 border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pendapatan Bulanan
            </CardTitle>
            <CardDescription>
              Ringkasan pendapatan 6 bulan terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72">
              <AreaChart data={data.monthlyEarnings} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="earningsGradientFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value: number) => {
                    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
                    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}Jt`;
                    return `${(value / 1000).toFixed(0)}K`;
                  }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [formatRupiah(value), 'Pendapatan']}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  name="Pendapatan"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#earningsGradientFill)"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Earnings by Category - Pie Chart */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pendapatan per Kategori
            </CardTitle>
            <CardDescription>
              Distribusi pendapatan berdasarkan kategori proyek
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.earningsByCategory.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center">
                <BarChart3 className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">Belum ada data kategori</p>
              </div>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-48 mx-auto">
                  <PieChart>
                    <Pie
                      data={data.earningsByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={35}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.earningsByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [formatRupiah(value), 'Pendapatan']}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto">
                  {data.earningsByCategory.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="text-slate-600 truncate">{cat.name}</span>
                      </div>
                      <span className="font-medium text-slate-700">{formatRupiah(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown Progress */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Rincian Pendapatan
          </CardTitle>
          <CardDescription>Pembagian pendapatan berdasarkan status proyek</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {[
              { icon: Briefcase, label: 'Proyek Aktif', value: data.activeEarnings, count: data.activeProjectCount, color: 'sky', barGrad: 'from-sky-400 to-sky-500' },
              { icon: CheckCircle, label: 'Selesai', value: data.completedEarnings, count: data.completedCount, color: 'emerald', barGrad: 'from-emerald-400 to-emerald-500' },
              { icon: Clock, label: 'Pending Payout', value: data.pendingEarnings, count: data.pendingPayoutCount, color: 'amber', barGrad: 'from-amber-400 to-amber-500' },
            ].map((item) => {
              const pct = data.totalEarnings > 0 ? (item.value / data.totalEarnings) * 100 : 0;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg bg-${item.color}-100 flex items-center justify-center`}>
                        <item.icon className={`h-3.5 w-3.5 text-${item.color}-500`} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold text-${item.color}-600`}>{formatRupiah(item.value)}</span>
                      <span className="text-xs text-slate-400 ml-1">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      className={`h-full rounded-full bg-gradient-to-r ${item.barGrad}`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 pl-9">{item.count} proyek</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown by Project */}
      {data.earningsByProject && data.earningsByProject.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Pendapatan per Proyek
                </CardTitle>
                <CardDescription>Rincian pendapatan berdasarkan proyek</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Laporan pendapatan sedang disiapkan...')}>
                <Download className="h-4 w-4 mr-2" />
                Ekspor Laporan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.earningsByProject.map((project) => {
                const statusColor = project.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : project.status === 'IN_PROGRESS'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-slate-100 text-slate-600';
                const statusLabel = project.status === 'COMPLETED'
                  ? 'Selesai'
                  : project.status === 'IN_PROGRESS'
                  ? 'Berjalan'
                  : project.status;

                return (
                  <motion.div
                    key={project.projectId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        project.status === 'COMPLETED' ? 'bg-emerald-100' : 'bg-primary/10'
                      }`}>
                        {project.status === 'COMPLETED'
                          ? <CheckCircle className="h-4 w-4 text-emerald-600" />
                          : <Briefcase className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{project.projectTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{project.category}</span>
                          <span className="text-xs text-slate-300">·</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor}`}>{statusLabel}</Badge>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 flex-shrink-0 ml-3">
                      {formatRupiah(project.amount)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments Section */}
      {data.pendingPayments && data.pendingPayments.length > 0 && (
        <Card className="border border-amber-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pembayaran Tertunda
            </CardTitle>
            <CardDescription>{data.pendingPayments.length} pembayaran menunggu konfirmasi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.pendingPayments.map((payment) => (
                <motion.div
                  key={payment.bidId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{payment.projectTitle}</p>
                      <p className="text-xs text-slate-400">Diajukan {getRelativeTime(payment.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-sm font-bold text-amber-700">{formatRupiah(payment.amount)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-amber-200 hover:bg-amber-100 text-amber-700"
                      onClick={() => toast.info(`Pengingat dikirim untuk ${payment.projectTitle}`)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Tindak Lanjut
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Transaksi Terbaru
              </CardTitle>
              <CardDescription>5 transaksi terakhir Anda</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Laporan pendapatan sedang disiapkan...')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Ekspor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.recentTransactions.slice(0, 5).map((tx) => {
                const statusInfo = getTransactionStatus(tx.status);
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedTx === tx.id;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50 ${
                        tx.status === 'PENDING' ? 'bg-amber-50/50 border-amber-100' : 'border-slate-100'
                      }`}
                      onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          tx.status === 'ACCEPTED' ? 'bg-emerald-100' :
                          tx.status === 'PENDING' ? 'bg-amber-100' :
                          'bg-slate-100'
                        }`}>
                          <StatusIcon className={`h-4 w-4 ${
                            tx.status === 'ACCEPTED' ? 'text-emerald-600' :
                            tx.status === 'PENDING' ? 'text-amber-600' :
                            'text-slate-400'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{tx.projectTitle}</p>
                          <p className="text-xs text-slate-400">{tx.category} &middot; {getRelativeTime(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span className="text-sm font-bold text-slate-900">{formatRupiah(tx.amount)}</span>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 pb-3"
                      >
                        <div className="ml-12 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">ID Transaksi</span>
                            <span className="font-mono text-slate-700">{tx.id}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-slate-500">Kategori</span>
                            <span className="text-slate-700">{tx.category}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tanggal</span>
                            <span className="text-slate-700">{getRelativeTime(tx.createdAt)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-slate-500">Status</span>
                            <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Cairkan Dana
            </DialogTitle>
            <DialogDescription>
              Saldo tersedia: <span className="font-bold text-primary">{formatRupiah(data.totalEarnings)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount">Jumlah Pencairan (Rp)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawBank">Nama Bank</Label>
              <Input
                id="withdrawBank"
                placeholder="BCA, Mandiri, BNI, dll"
                value={withdrawBank}
                onChange={(e) => setWithdrawBank(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawAccount">Nomor Rekening</Label>
              <Input
                id="withdrawAccount"
                placeholder="Masukkan nomor rekening"
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawHolder">Nama Pemilik Rekening</Label>
              <Input
                id="withdrawHolder"
                placeholder="Sesuai buku rekening"
                value={withdrawHolder}
                onChange={(e) => setWithdrawHolder(e.target.value)}
              />
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Pencairan akan diproses dalam 3-5 hari kerja. Pastikan data bank benar.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Batal</Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleWithdraw}
              disabled={submittingWithdraw}
            >
              {submittingWithdraw ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                <><Wallet className="h-4 w-4 mr-2" /> Ajukan Pencairan</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
