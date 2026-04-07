'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  CheckCircle, TrendingUp, Star, Clock,
  TrendingDown, Minus, BarChart3, Activity, Timer, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PerformanceChartsProps {
  userId: string;
}

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'stable';
}

interface PerformanceData {
  projectCompletionTrend: Array<{ month: string; label: string; completed: number; total: number }>;
  bidSuccessRateTrend: Array<{ month: string; label: string; rate: number }>;
  ratingTrend: Array<{ month: string; label: string; rating: number }>;
  responseTimeTrend: Array<{ month: string; label: string; hours: number }>;
  trends: {
    completion: TrendData;
    bidSuccess: TrendData;
    rating: TrendData;
    responseTime: TrendData;
  };
}

function TrendIndicator({ trend }: { trend: TrendData }) {
  if (trend.direction === 'stable' || trend.value === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
        <Minus className="h-3 w-3" /> Stabil
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      trend.direction === 'up' ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
    }`}>
      {trend.direction === 'up' ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {trend.direction === 'up' ? '+' : '-'}{trend.value}%
    </span>
  );
}

function ChartSkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full rounded" />
      </CardContent>
    </Card>
  );
}

function EmptyStateIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Decorative background circles */}
        <div className="absolute -inset-8 bg-gradient-to-br from-primary/5 to-teal-500/5 rounded-full blur-2xl" />
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
          <div className="relative">
            <BarChart3 className="h-10 w-10 text-slate-300" />
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap className="h-4 w-4 text-amber-400 absolute -top-2 -right-2" />
            </motion.div>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-center mt-6"
      >
        <h3 className="text-base font-semibold text-slate-700 mb-1">Belum Ada Data Performa</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          Mulai menawar dan menyelesaikan proyek untuk melihat grafik performa Anda di sini
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Penyelesaian Proyek
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Star className="h-3.5 w-3.5" />
            Rating
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Timer className="h-3.5 w-3.5" />
            Waktu Respons
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StyledTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload?: Record<string, unknown> }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-xl shadow-slate-900/10 p-3 text-xs"
      >
        <p className="font-semibold text-slate-700 mb-1.5 pb-1.5 border-b border-slate-100">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500">{entry.name}</span>
            </div>
            <span className="font-bold text-slate-700">{entry.value}</span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
}

export function PerformanceCharts({ userId }: PerformanceChartsProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/performance?userId=${userId}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <ChartSkeletonCard />
        <ChartSkeletonCard />
        <ChartSkeletonCard />
        <ChartSkeletonCard />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="md:col-span-2"><CardContent><EmptyStateIllustration /></CardContent></Card>
      </div>
    );
  }

  const chartColors = {
    primary: 'hsl(var(--primary))',
    primaryLight: 'hsl(var(--primary) / 0.15)',
    green: 'hsl(142, 71%, 45%)',
    greenLight: 'hsl(142, 71%, 45% / 0.15)',
    amber: 'hsl(38, 92%, 50%)',
    amberLight: 'hsl(38, 92%, 50% / 0.15)',
    red: 'hsl(0, 84%, 60%)',
    redLight: 'hsl(0, 84%, 60% / 0.15)',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid md:grid-cols-2 gap-4"
    >
      {/* 1. Project Completion Trend */}
      <motion.div variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Tren Penyelesaian Proyek</CardTitle>
                </div>
              </div>
              <TrendIndicator trend={data.trends.completion} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.projectCompletionTrend}>
                  <defs>
                    <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.green} stopOpacity={1} />
                      <stop offset="100%" stopColor={chartColors.green} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="completionGradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<StyledTooltip />} />
                  <Bar dataKey="completed" name="Selesai" fill="url(#completionGrad)" radius={[4, 4, 0, 0]} animationDuration={1200} />
                  <Bar dataKey="total" name="Total" fill="url(#completionGradTotal)" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Bid Success Rate */}
      <motion.div variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-primary/15 to-teal-500/15 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm">Tren Tingkat Keberhasilan Bid</CardTitle>
                </div>
              </div>
              <TrendIndicator trend={data.trends.bidSuccess} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.bidSuccessRateTrend}>
                  <defs>
                    <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.35} />
                      <stop offset="50%" stopColor={chartColors.primary} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<StyledTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    name="Keberhasilan (%)"
                    stroke={chartColors.primary}
                    strokeWidth={2.5}
                    fill="url(#bidGrad)"
                    dot={{ fill: 'white', strokeWidth: 2.5, r: 4, stroke: chartColors.primary }}
                    activeDot={{ r: 6, fill: chartColors.primary, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Rating Trend */}
      <motion.div variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg">
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-sm">Tren Rating</CardTitle>
                </div>
              </div>
              <TrendIndicator trend={data.trends.rating} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.ratingTrend}>
                  <defs>
                    <linearGradient id="ratingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.amber} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={chartColors.amber} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 5]} />
                  <Tooltip content={<StyledTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    name="Rating"
                    stroke="none"
                    fill="url(#ratingAreaGrad)"
                    animationDuration={1200}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    name="Rating"
                    stroke={chartColors.amber}
                    strokeWidth={2.5}
                    dot={{ fill: 'white', strokeWidth: 2.5, r: 4, stroke: chartColors.amber }}
                    activeDot={{ r: 6, fill: chartColors.amber, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Response Time */}
      <motion.div variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-slate-100 to-slate-200/80 rounded-lg">
                  <Timer className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">Waktu Respons</CardTitle>
                </div>
              </div>
              <TrendIndicator trend={data.trends.responseTime} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.responseTimeTrend}>
                  <defs>
                    <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<StyledTooltip />} />
                  <Bar
                    dataKey="hours"
                    name="Jam"
                    fill="url(#responseGrad)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1200}
                    animationBegin={100}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
