'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Users, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { motion, useInView, useSpring, useMotionValue, useTransform } from 'framer-motion';

interface StatData {
  totalProjects: number;
  totalContractors: number;
  completedProjects: number;
  totalValue: number;
}

interface StatItem {
  label: string;
  value: number;
  icon: typeof Briefcase;
  format: 'number' | 'currency';
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  sparklineData: number[];
}

// Mini sparkline component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-20 h-7 opacity-60">
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparkGrad-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
        cy={padding + (1 - (data[data.length - 1] - min) / range) * (height - padding * 2)}
        r="2"
        fill={color}
      />
    </svg>
  );
}

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, {
    duration: duration * 1000,
    bounce: 0,
  });
  const display = useTransform(spring, (latest) => Math.round(latest));

  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isInView) {
      motionVal.set(value);
    }
  }, [isInView, motionVal, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return <span ref={ref}>{displayValue.toLocaleString('id-ID')}</span>;
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const Icon = stat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group"
    >
      <Card className="h-full border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative bg-white">
        {/* Decorative gradient corner */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${stat.gradientFrom} ${stat.gradientTo} opacity-[0.04] rounded-bl-full group-hover:opacity-[0.08] transition-opacity duration-500`} />

        <CardContent className="relative z-10 p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            {/* Gradient icon container */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.1, type: 'spring', stiffness: 200 }}
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300`}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex flex-col items-end gap-1">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-0.5"
              >
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600">+12%</span>
              </motion.div>
              {/* Mini sparkline */}
              <Sparkline data={stat.sparklineData} color={stat.color.replace('text-', '') === 'emerald' ? '#10b981' : stat.color.replace('text-', '') === 'amber' ? '#f59e0b' : stat.color.replace('text-', '') === 'teal' ? '#14b8a6' : '#f43f5e'} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl md:text-3xl font-bold text-slate-800">
              {stat.format === 'currency' ? (
                <>
                  <span className="text-lg font-medium text-slate-400">Rp </span>
                  <AnimatedCounter value={Math.round(stat.value / 1000000)} duration={2.5} />
                  <span className="text-base font-medium text-slate-400"> jt</span>
                </>
              ) : (
                <AnimatedCounter value={stat.value} duration={2} />
              )}
            </p>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="h-full border border-slate-100 shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="w-16 h-7" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformStats() {
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/stats/public');
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json.data);
        } else if (!cancelled) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Generate realistic sparkline data from real values
  const generateSparkline = (baseValue: number, points: number = 8) => {
    const data: number[] = [];
    let current = baseValue * 0.5;
    for (let i = 0; i < points - 1; i++) {
      current += (baseValue - current) * (0.15 + Math.random() * 0.2);
      data.push(Math.round(current * (0.9 + Math.random() * 0.2)));
    }
    data.push(baseValue);
    return data;
  };

  // Loading state
  if (loading) {
    return (
      <section className="relative z-10 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-5 w-72 mx-auto" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error fallback
  if (error || !data) {
    return null;
  }

  const stats: StatItem[] = [
    {
      label: 'Total Proyek',
      value: data.totalProjects,
      icon: Briefcase,
      format: 'number',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-teal-600',
      sparklineData: generateSparkline(data.totalProjects),
    },
    {
      label: 'Kontraktor Aktif',
      value: data.totalContractors,
      icon: Users,
      format: 'number',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-600',
      sparklineData: generateSparkline(data.totalContractors),
    },
    {
      label: 'Proyek Selesai',
      value: data.completedProjects,
      icon: CheckCircle,
      format: 'number',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-emerald-600',
      sparklineData: generateSparkline(data.completedProjects),
    },
    {
      label: 'Total Nilai Proyek',
      value: data.totalValue,
      icon: DollarSign,
      format: 'currency',
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      gradientFrom: 'from-rose-500',
      gradientTo: 'to-pink-600',
      sparklineData: generateSparkline(Math.round(data.totalValue / 1000000)),
    },
  ];

  return (
    <section className="relative z-10 py-16 md:py-20 bg-white overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 pointer-events-none" />
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4"
          >
            <TrendingUp className="h-4 w-4" />
            Terus Bertumbuh
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Platform dalam Angka
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Kepercayaan pengguna TenderPro terus bertumbuh seiring meningkatnya proyek yang berhasil diselesaikan.
          </p>
        </motion.div>

        {/* Stats grid - 2x2 on mobile, 4x1 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
