'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/components/ui';
import { Search, MapPin, Clock, Briefcase, FileText, ArrowUpDown, Filter, Users, CalendarDays, Bookmark, Eye, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { formatRupiah } from '@/lib/helpers';

interface AvailableProject {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  duration?: number;
  bidCount: number;
  hasBid: boolean;
  description?: string;
  deadline?: string;
  createdAt?: string;
  owner: { name: string; company?: string };
}

interface AvailableProjectsTabProps {
  onBidClick: (project: AvailableProject) => void;
}

const categoryOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'Pembangunan Baru', label: 'Pembangunan Baru' },
  { value: 'Renovasi', label: 'Renovasi' },
  { value: 'Interior', label: 'Interior' },
  { value: 'Konstruksi', label: 'Konstruksi' },
  { value: 'MEP', label: 'MEP' },
];

const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'budget_high', label: 'Budget Tertinggi' },
  { value: 'deadline', label: 'Deadline Terdekat' },
];

// Category configuration with emojis and gradient styles
const categoryConfig: Record<string, { emoji: string; color: string; gradient: string; border: string; badge: string; bg: string }> = {
  'Pembangunan Baru': {
    emoji: '🏗️',
    color: 'text-primary',
    gradient: 'from-primary to-teal-500',
    border: 'border-t-primary',
    badge: 'bg-primary/10 text-primary border-primary/20',
    bg: 'bg-primary/5',
  },
  'Renovasi': {
    emoji: '🔨',
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-t-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bg: 'bg-amber-50/50',
  },
  'Interior': {
    emoji: '🎨',
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-500',
    border: 'border-t-violet-500',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    bg: 'bg-violet-50/50',
  },
  'Konstruksi': {
    emoji: '🏗️',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-green-500',
    border: 'border-t-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bg: 'bg-emerald-50/50',
  },
  'MEP': {
    emoji: '⚡',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-500',
    border: 'border-t-orange-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    bg: 'bg-orange-50/50',
  },
  'Lainnya': {
    emoji: '📋',
    color: 'text-slate-600',
    gradient: 'from-slate-400 to-slate-500',
    border: 'border-t-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    bg: 'bg-slate-50/50',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// Animated counter component for budget display
function AnimatedBudget({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => formatRupiah(latest));

  useEffect(() => {
    if (inView) {
      animate(motionValue, value, {
        duration: 0.8,
        ease: 'easeOut',
      });
    }
  }, [inView, motionValue, value]);

  return (
    <motion.span ref={ref} className="text-lg font-bold text-primary tabular-nums">
      {display}
    </motion.span>
  );
}

function isNewProject(createdAt?: string): boolean {
  if (!createdAt) return false;
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 24 * 60 * 60 * 1000; // Less than 24 hours
}

export function AvailableProjectsTab({ onBidClick }: AvailableProjectsTabProps) {
  const [projects, setProjects] = useState<AvailableProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects?status=OPEN&limit=20');
      const data = await res.json();
      let existingBidProjectIds = new Set<string>();
      try {
        const bidsRes = await fetch('/api/bids?my=true&limit=100');
        const bidsData = await bidsRes.json();
        if (bidsData.bids) {
          existingBidProjectIds = new Set(bidsData.bids.map((b: Record<string, unknown>) => b.projectId as string));
        }
      } catch { /* ignore */ }
      if (data.projects) {
        setProjects(data.projects.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.title as string,
          category: p.category as string,
          location: p.location as string,
          budget: p.budget as number,
          duration: p.duration as number | undefined,
          bidCount: p.bidCount as number,
          hasBid: existingBidProjectIds.has(p.id as string),
          description: p.description as string | undefined,
          deadline: p.endDate as string | undefined,
          createdAt: p.createdAt as string | undefined,
          owner: { name: (p.owner as Record<string, unknown>)?.name as string || 'Pemilik Proyek' },
        })));
      }
    } catch (error) {
      console.error('Gagal memuat proyek:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'budget_high':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'deadline':
        result.sort((a, b) => {
          const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return da - db;
        });
        break;
      default:
        break;
    }

    return result;
  }, [projects, filterCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Proyek Tersedia
            {filteredProjects.length > 0 && (
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {filteredProjects.length}
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Temukan proyek yang sesuai dengan keahlian Anda
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Platform TenderPro Indonesia</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari proyek berdasarkan nama, lokasi, atau kategori..."
            className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-1 w-full" />
              <Skeleton className="h-4 w-3/4 m-6 mb-0" />
              <Skeleton className="h-3 w-1/2 mx-6 mt-3" />
              <div className="p-6 pt-4 space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shadow-sm">
            <Search className="h-10 w-10 text-slate-300" />
          </div>
          <p className="font-bold text-slate-700 text-lg mb-1">Tidak ada proyek yang tersedia</p>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            {searchQuery || filterCategory !== 'all'
              ? 'Coba ubah filter atau kata kunci pencarian Anda'
              : 'Belum ada proyek baru yang tersedia saat ini'}
          </p>
          {(searchQuery || filterCategory !== 'all') && (
            <Button
              variant="outline"
              className="mt-5 h-10"
              onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}
            >
              Reset Filter
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => {
              const config = categoryConfig[project.category] || categoryConfig['Lainnya'];
              const isNew = isNewProject(project.createdAt);

              return (
                <motion.div
                  key={project.id}
                  variants={cardVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px -12px rgba(0,0,0,0.12)' }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`overflow-hidden border-slate-100 hover:border-transparent transition-all duration-200 h-full flex flex-col group relative`}>
                    {/* Gradient top border */}
                    <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />

                    {/* New badge pulse */}
                    {isNew && (
                      <div className="absolute top-3 right-3 z-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative"
                        >
                          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                          <span className="relative flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 rounded-full shadow-md shadow-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            BARU
                          </span>
                        </motion.div>
                      </div>
                    )}

                    <CardContent className="p-4 flex-1 flex flex-col">
                      {/* Category badge + bid count */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`${config.badge} border text-xs font-medium gap-1.5`}>
                          <span>{config.emoji}</span>
                          {project.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="h-3 w-3" />
                          <span className="font-medium">{project.bidCount} penawaran</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-slate-800 mb-2 line-clamp-2 text-[15px] leading-snug group-hover:text-primary transition-colors duration-200">
                        {project.title}
                      </h4>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {project.location}
                        </span>
                        {project.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {project.duration} hari
                          </span>
                        )}
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-slate-400" />
                            {new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Budget with animated counter */}
                      <div className={`rounded-lg ${config.bg} px-3 py-2 mb-3`}>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Budget Proyek</p>
                        <AnimatedBudget value={project.budget} />
                      </div>

                      {/* Description excerpt */}
                      {project.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                          {project.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
                          <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-3 w-3 text-slate-400" />
                          </div>
                          <span className="truncate">{project.owner.name}</span>
                        </div>

                        {/* Action buttons: slide in on hover */}
                        <div className="flex items-center gap-1.5">
                          {/* Bookmark button - always visible */}
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>

                          {/* Bid button */}
                          <Button
                            size="sm"
                            className={`h-8 text-xs gap-1.5 rounded-lg transition-all duration-200 ${
                              project.hasBid
                                ? 'bg-slate-100 text-slate-500 cursor-default'
                                : `bg-gradient-to-r ${config.gradient} text-white shadow-md hover:shadow-lg`
                            }`}
                            onClick={() => !project.hasBid && onBidClick(project)}
                            disabled={project.hasBid}
                          >
                            <FileText className="h-3 w-3" />
                            {project.hasBid ? (
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Sudah Bid
                              </span>
                            ) : (
                              <>
                                Ajukan
                                <ChevronRight className="h-3 w-3" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
