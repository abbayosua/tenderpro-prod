'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Briefcase, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/helpers';

interface EarningsData {
  totalEarnings: number;
  projectCount: number;
  averageEarningsPerProject: number;
  activeProjectCount: number;
  monthlyEarnings: Array<{ month: string; earnings: number; projectCount: number }>;
  monthTrend: number;
  trendDirection: 'up' | 'down' | 'stable';
  currentMonthEarnings: number;
  lastMonthEarnings: number;
}

interface EarningsOverviewProps {
  userId: string;
}

export function EarningsOverview({ userId }: EarningsOverviewProps) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const chartConfig: ChartConfig = {
    earnings: { label: 'Pendapatan', color: 'hsl(var(--primary))' },
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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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

  const summaryCards = [
    {
      label: 'Total Pendapatan',
      value: formatRupiah(data.totalEarnings),
      icon: DollarSign,
      color: 'primary',
      borderColor: 'border-l-primary',
      iconBg: 'bg-primary/10',
      iconText: 'text-primary',
      gradient: 'from-primary/15 to-primary/5',
    },
    {
      label: 'Rata-rata per Proyek',
      value: formatRupiah(data.averageEarningsPerProject),
      icon: BarChart3,
      color: 'blue',
      borderColor: 'border-l-sky-500',
      iconBg: 'bg-sky-100',
      iconText: 'text-sky-600',
      gradient: 'from-sky-500/15 to-sky-500/5',
    },
    {
      label: 'Proyek Aktif',
      value: `${data.activeProjectCount} proyek`,
      icon: Briefcase,
      color: 'green',
      borderColor: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      gradient: 'from-emerald-500/15 to-emerald-500/5',
    },
    {
      label: 'Tren Bulan Ini',
      value: `${data.trendDirection === 'up' ? '+' : ''}${data.monthTrend}%`,
      icon: data.trendDirection === 'up' ? TrendingUp : data.trendDirection === 'down' ? TrendingDown : BarChart3,
      color: data.trendDirection === 'up' ? 'green' : data.trendDirection === 'down' ? 'red' : 'yellow',
      borderColor: data.trendDirection === 'up'
        ? 'border-l-emerald-500'
        : data.trendDirection === 'down'
          ? 'border-l-red-500'
          : 'border-l-amber-500',
      iconBg: data.trendDirection === 'up'
        ? 'bg-emerald-100'
        : data.trendDirection === 'down'
          ? 'bg-red-100'
          : 'bg-amber-100',
      iconText: data.trendDirection === 'up'
        ? 'text-emerald-600'
        : data.trendDirection === 'down'
          ? 'text-red-600'
          : 'text-amber-600',
      gradient: data.trendDirection === 'up'
        ? 'from-emerald-500/15 to-emerald-500/5'
        : data.trendDirection === 'down'
          ? 'from-red-500/15 to-red-500/5'
          : 'from-amber-500/15 to-amber-500/5',
      trend: data.trendDirection !== 'stable' ? (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          data.trendDirection === 'up' ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {data.trendDirection === 'up'
            ? <ArrowUpRight className="h-3 w-3" />
            : <ArrowDownRight className="h-3 w-3" />
          }
          {formatRupiah(Math.abs(data.currentMonthEarnings - data.lastMonthEarnings))}
        </div>
      ) : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`border-l-4 ${card.borderColor} hover:shadow-lg transition-all duration-300 overflow-hidden`}>
            <CardContent className="p-4 bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 truncate">{card.value}</p>
                  {card.trend && <div className="mt-1">{card.trend}</div>}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm flex-shrink-0 ml-2`}>
                  <card.icon className={`h-5 w-5 ${card.iconText}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Earnings Chart */}
      <Card>
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
            <BarChart data={data.monthlyEarnings} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
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
              <Bar
                dataKey="earnings"
                name="Pendapatan"
                fill="url(#earningsGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
