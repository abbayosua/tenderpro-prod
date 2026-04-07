'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Star, ArrowRight, Quote, Briefcase, Clock, TrendingDown, Eye } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { successProjects } from '@/data';
import { formatRupiah } from '@/lib/helpers';

type FilterCategory = 'Semua' | 'Pembangunan Baru' | 'Renovasi' | 'Komersial' | 'Interior' | 'Perumahan';

const filterCategories: FilterCategory[] = ['Semua', 'Pembangunan Baru', 'Renovasi', 'Komersial', 'Interior', 'Perumahan'];

const projectStatuses: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  'Selesai': { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  'On-Time': { label: 'Tepat Waktu', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: Clock },
  'Under Budget': { label: 'Di Bawah Anggaran', color: 'bg-green-100 text-green-700 border-green-200', icon: TrendingDown },
};

const testimonials: string[] = [
  'Hasil pembangunan sangat memuaskan, kontraktor sangat profesional dan menepati waktu.',
  'Renovasi berjalan lancar tanpa hambatan. Komunikasi sangat baik sepanjang proyek.',
  'Kualitas bangunan excellent, sesuai dengan spesifikasi yang disepakati. Sangat direkomendasikan!',
  'Proyek selesai lebih cepat dari jadwal dengan hasil yang melebihi ekspektasi kami.',
  'Tim kontraktor sangat berpengalaman dan memberikan solusi kreatif untuk setiap tantangan.',
  'Pengerjaan rapi dan detail. Kami sangat puas dengan hasil akhir proyek ini.',
];

const ratings = [4.9, 4.8, 5.0, 4.7, 4.9, 4.8];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = target;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
      <span className={`ml-1 font-semibold ${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-700`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function CompletionRing({ percentage }: { percentage: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-12 h-12">
      <svg ref={ref} className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          className="text-slate-100"
          strokeWidth="4"
        />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="url(#completionGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(200, 98%, 39%)" />
            <stop offset="100%" stopColor="hsl(160, 84%, 39%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-700">{percentage}%</span>
      </div>
    </div>
  );
}

export function SuccessProjectsSection() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Semua');

  const filteredProjects = activeFilter === 'Semua'
    ? successProjects
    : successProjects.filter((p) => p.category === activeFilter);

  return (
    <section id="success-projects" className="relative z-10 py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
            <Briefcase className="h-4 w-4" />
            <span className="font-semibold text-sm">Portofolio</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Proyek{' '}
            <span className="gradient-text">Sukses</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Bukti kepercayaan dari klien kami di seluruh Indonesia
          </p>
        </motion.div>

        {/* Animated counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-sm text-slate-600">Proyek Selesai:</span>
            <span className="text-xl font-bold text-primary">
              <AnimatedCounter target={500} suffix="+" />
            </span>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {filterCategories.map((cat) => {
            const isActive = activeFilter === cat;
            const count = cat === 'Semua'
              ? successProjects.length
              : successProjects.filter((p) => p.category === cat).length;
            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-md shadow-primary/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary'
                }`}
              >
                {cat}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Project Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.title}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                layout
              >
                <Card className="overflow-hidden h-full border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
                  {/* Image with gradient overlay */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Bottom gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

                    {/* Status badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <Badge className="bg-primary text-white text-xs border-0 shadow-sm">
                        {project.category}
                      </Badge>
                      {index === 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Badge className="bg-amber-500 text-white text-xs border-0 shadow-sm">
                            <Star className="h-3 w-3 mr-1" /> Featured
                          </Badge>
                        </motion.div>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                      {projectStatuses['Selesai'] && (
                        <Badge variant="outline" className="bg-white/90 text-slate-700 backdrop-blur-sm text-xs">
                          <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" /> Selesai
                        </Badge>
                      )}
                    </div>

                    {/* Completion ring overlay */}
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                        <CompletionRing percentage={100} />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Title & Location */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5" /> {project.location}
                      </p>
                    </div>

                    {/* Status badges row */}
                    {(() => {
                      const onTimeStatus = projectStatuses['On-Time'];
                      const underBudgetStatus = projectStatuses['Under Budget'];
                      const OnTimeIcon = onTimeStatus.icon;
                      const UnderBudgetIcon = underBudgetStatus.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${onTimeStatus.color}`}>
                            <OnTimeIcon className="h-2.5 w-2.5 mr-0.5" />
                            {onTimeStatus.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${underBudgetStatus.color}`}>
                            <UnderBudgetIcon className="h-2.5 w-2.5 mr-0.5" />
                            {underBudgetStatus.label}
                          </Badge>
                        </div>
                      );
                    })()}

                    {/* Star Rating */}
                    <StarRating rating={ratings[index] || 4.8} />

                    {/* Project Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Nilai Proyek</span>
                        <span className="font-bold text-primary">{formatRupiah(project.budget)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Durasi</span>
                        <span className="font-medium text-slate-700">{project.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kontraktor</span>
                        <span className="font-medium text-slate-700 text-right text-xs max-w-[160px] truncate">{project.contractor}</span>
                      </div>
                    </div>

                    {/* Client Testimonial */}
                    <div className="relative rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <Quote className="absolute top-2 right-3 h-5 w-5 text-primary/15" />
                      <p className="text-xs text-slate-600 italic leading-relaxed pr-6">
                        &ldquo;{testimonials[index] || 'Proyek diselesaikan dengan sangat baik.'}&rdquo;
                      </p>
                    </div>

                    {/* Lihat Detail Button with arrow animation */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-slate-200 text-sm text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group/btn"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty state for filtered results */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Belum ada proyek untuk kategori ini</p>
            <Button
              variant="ghost"
              className="mt-3 text-primary"
              onClick={() => setActiveFilter('Semua')}
            >
              Lihat semua proyek
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
