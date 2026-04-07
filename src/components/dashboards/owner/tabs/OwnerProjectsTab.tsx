'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Progress, ScrollArea } from '@/components/ui';
import { FolderOpen, MapPin, FileText, Eye, Plus, ChevronRight, Building2, Star, CheckCircle, Video, Flag, Search, X, SlidersHorizontal, Server, Loader2, Monitor } from 'lucide-react';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/helpers';
import type { Milestone } from '@/types';
import type { OwnerProjectsTabProps } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Filter Options ──────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draf' },
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Berjalan' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'Pembangunan Baru', label: 'Pembangunan Baru' },
  { value: 'Renovasi', label: 'Renovasi' },
  { value: 'Interior', label: 'Interior' },
  { value: 'Konstruksi', label: 'Konstruksi' },
  { value: 'MEP', label: 'MEP' },
  { value: 'Lainnya', label: 'Lainnya' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'budget_high', label: 'Budget Tertinggi' },
  { value: 'budget_low', label: 'Budget Terendah' },
  { value: 'most_bids', label: 'Paling Banyak Bid' },
];

const STATUS_LABELS: Record<string, string> = {
  all: 'Semua Status',
  DRAFT: 'Draf',
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export function OwnerProjectsTab({
  ownerStats,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  onShowCreateProject,
  onShowCCTV,
  onShowProgress,
  onAcceptBid,
  onRejectBid,
  loadMilestones,
  milestones,
}: OwnerProjectsTabProps) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [useServerFilter, setUseServerFilter] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverProjects, setServerProjects] = useState<Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    budget: number;
    status: string;
    bidCount: number;
    createdAt?: string;
    duration?: number;
    viewCount?: number;
    bids: Array<{
      id: string;
      price: number;
      duration: number;
      status: string;
      proposal: string;
      contractor: { id: string; name: string; company?: string; rating?: number; totalProjects?: number };
    }>;
  }>>([]);
  const [serverTotal, setServerTotal] = useState(0);

  // Calculate progress from milestones
  const getProgress = () => {
    const completed = milestones.filter((m: Milestone) => m.status === 'COMPLETED').length;
    const total = milestones.length || 1;
    return Math.round((completed / total) * 100);
  };

  const projects = ownerStats?.projects ?? [];

  // Server-side filter fetch
  const fetchServerFiltered = useCallback(async () => {
    setServerLoading(true);
    try {
      const body: Record<string, unknown> = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        sortBy,
        page: 1,
        limit: 20,
      };
      const res = await fetch('/api/projects/filtered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setServerProjects(data.projects || []);
        setServerTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Server filter error:', error);
    } finally {
      setServerLoading(false);
    }
  }, [filterStatus, filterCategory, sortBy]);

  useEffect(() => {
    if (useServerFilter) {
      fetchServerFiltered();
    }
  }, [useServerFilter, fetchServerFiltered]);

  // Apply all client-side filters
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }

    // Search query
    if (searchQuery !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'budget_high':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget_low':
        result.sort((a, b) => a.budget - b.budget);
        break;
      case 'most_bids':
        result.sort((a, b) => (b.bidCount || 0) - (a.bidCount || 0));
        break;
    }

    return result;
  }, [projects, filterStatus, filterCategory, searchQuery, sortBy]);

  // Determine which project list to display
  const displayProjects = useServerFilter ? serverProjects : filteredProjects;
  const displayTotal = useServerFilter ? serverTotal : projects.length;

  // Active filter tags
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
  if (filterStatus !== 'all') {
    activeFilters.push({
      key: 'status',
      label: STATUS_LABELS[filterStatus] || filterStatus,
      onRemove: () => setFilterStatus('all'),
    });
  }
  if (filterCategory !== 'all') {
    activeFilters.push({
      key: 'category',
      label: filterCategory,
      onRemove: () => setFilterCategory('all'),
    });
  }
  if (searchQuery !== '') {
    activeFilters.push({
      key: 'search',
      label: `"${searchQuery}"`,
      onRemove: () => setSearchQuery(''),
    });
  }

  const hasActiveFilters = activeFilters.length > 0 || sortBy !== 'newest';

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterCategory('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari proyek..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Server/Client filter toggle */}
          <Button
            variant={useServerFilter ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setUseServerFilter(!useServerFilter)}
          >
            {useServerFilter ? (
              <Server className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            {useServerFilter ? 'Server Filter' : 'Client Filter'}
          </Button>

          {/* Toggle advanced filters */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter Lanjutan
            {(filterCategory !== 'all' || sortBy !== 'newest') && (
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </Button>
        </div>

        {/* Advanced filters (collapsible) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {/* Category filter */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs font-medium text-slate-500">Kategori</span>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort by */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs font-medium text-slate-500">Urutkan</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Terbaru" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Server filter indicator */}
        {useServerFilter && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Server className="h-3.5 w-3.5 text-primary" />
            <span>Mode filter server aktif — filter dilakukan di sisi server</span>
          </div>
        )}

        {/* Active filter tags + Result count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters ? (
              <>
                <span className="text-sm text-slate-500">
                  Menampilkan <strong className="text-slate-700">{displayProjects.length}</strong> dari{' '}
                  <strong className="text-slate-700">{displayTotal}</strong> proyek
                </span>
                {activeFilters.map((filter) => (
                  <Badge
                    key={filter.key}
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={filter.onRemove}
                  >
                    {filter.label}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                {sortBy !== 'newest' && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => setSortBy('newest')}
                  >
                    Urutkan: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                    <X className="h-3 w-3" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 hover:text-slate-600 h-6 px-2"
                  onClick={resetFilters}
                >
                  Reset Filter
                </Button>
              </>
            ) : (
              <span className="text-sm text-slate-500">
                Menampilkan <strong className="text-slate-700">{displayTotal}</strong> proyek
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Project List */}
      {serverLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-500">Memuat proyek dari server...</p>
          </CardContent>
        </Card>
      ) : displayProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            {!useServerFilter && projects.length === 0 ? (
              <>
                <p className="text-slate-500 mb-4">Belum ada proyek</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onShowCreateProject}>
                  <Plus className="h-4 w-4 mr-2" /> Buat Proyek Pertama
                </Button>
              </>
            ) : (
              <p className="text-slate-500">Tidak ada proyek yang cocok dengan filter. Coba ubah filter Anda.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          key={`${filterStatus}-${filterCategory}-${sortBy}-${searchQuery}-${useServerFilter}`}
        >
          <AnimatePresence>
            {displayProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={cardVariants}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card
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
                          <span className="font-medium">{getProgress()}%</span>
                        </div>
                        <Progress value={getProgress()} className="h-2" />
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
                            className="flex-1 bg-primary hover:bg-primary/90"
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
                        <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {project.viewCount || 0}</span>
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

                    {project.bids && project.bids.length > 0 && project.status === 'OPEN' && (
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
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
