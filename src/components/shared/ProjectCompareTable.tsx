'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, GitCompare, Trophy, AlertTriangle, Clock, Sparkles, Loader2, ArrowUpDown, Eye, FolderOpen, TrendingUp } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatRupiah, getStatusLabel, getStatusColor } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';

interface ComparedProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  bidCount: number;
  averageBid: number;
  lowestBid: number;
  highestBid: number;
  ownerName: string;
  progress: number;
  milestonesCompleted: number;
  milestonesTotal: number;
}

interface ComparisonSummary {
  cheapestProject: { id: string; title: string; budget: number } | null;
  mostBidsProject: { id: string; title: string; bidCount: number } | null;
  closestToDeadline: { id: string; title: string; endDate: string | null; daysLeft: number } | null;
  recommendedProject: { id: string; title: string; reason: string } | null;
}

interface ProjectCompareTableProps {
  projectIds: string[];
  onClose: () => void;
}

type SortKey = 'budget' | 'duration' | 'progress' | 'bidCount' | 'lowestBid' | 'status';
type SortDirection = 'asc' | 'desc';

// Empty state component
function EmptyCompareState({ minProjects = 2 }: { minProjects?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <FolderOpen className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Pilih Proyek untuk Dibandingkan</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        Pilih minimal {minProjects} proyek dari daftar untuk melihat perbandingan secara berdampingan.
      </p>
    </motion.div>
  );
}

export function ProjectCompareTable({ projectIds, onClose }: ProjectCompareTableProps) {
  const [projects, setProjects] = useState<ComparedProject[]>([]);
  const [comparison, setComparison] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('budget');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (projectIds.length < 2) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/projects/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectIds }),
        });
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setProjects(json.data.projects);
            setComparison(json.data.comparison);
          } else {
            setError(json.error || 'Gagal membandingkan proyek');
          }
        }
      } catch {
        if (!cancelled) setError('Gagal membandingkan proyek');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectIds]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortKey) {
        case 'budget': aVal = a.budget; bVal = b.budget; break;
        case 'duration': aVal = a.duration || 0; bVal = b.duration || 0; break;
        case 'progress': aVal = a.progress; bVal = b.progress; break;
        case 'bidCount': aVal = a.bidCount; bVal = b.bidCount; break;
        case 'lowestBid': aVal = a.lowestBid; bVal = b.lowestBid; break;
        case 'status': aVal = a.status; bVal = b.status; break;
      }

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal as string);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [projects, sortKey, sortDirection]);

  if (projectIds.length < 2) {
    return (
      <Card className="border shadow-sm">
        <CardContent>
          <EmptyCompareState />
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <p className="text-slate-500 font-medium">Memuat perbandingan proyek...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || projects.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-slate-600 font-medium">{error || 'Tidak ada data proyek'}</p>
          <p className="text-sm text-slate-400 mt-1">Periksa koneksi internet atau coba lagi nanti</p>
        </CardContent>
      </Card>
    );
  }

  // Comparison rows configuration
  const rows: Array<{
    label: string;
    key: SortKey | null;
    sortable: boolean;
    render: (project: ComparedProject) => React.ReactNode;
  }> = [
    {
      label: 'Nama Proyek',
      key: null,
      sortable: false,
      render: (p) => <span className="font-semibold text-sm">{p.title}</span>,
    },
    {
      label: 'Kategori',
      key: null,
      sortable: false,
      render: (p) => (
        <Badge variant="outline" className="text-xs font-medium">{p.category}</Badge>
      ),
    },
    {
      label: 'Lokasi',
      key: null,
      sortable: false,
      render: (p) => <span className="text-sm text-slate-600">{p.location}</span>,
    },
    {
      label: 'Anggaran',
      key: 'budget',
      sortable: true,
      render: (p) => (
        <span className="font-semibold text-sm text-primary">{formatRupiah(p.budget)}</span>
      ),
    },
    {
      label: 'Durasi',
      key: 'duration',
      sortable: true,
      render: (p) => <span className="text-sm text-slate-600">{p.duration ? `${p.duration} hari` : '-'}</span>,
    },
    {
      label: 'Status',
      key: 'status',
      sortable: true,
      render: (p) => (
        <Badge className={`text-xs font-semibold ${getStatusColor(p.status)}`}>
          {getStatusLabel(p.status)}
        </Badge>
      ),
    },
    {
      label: 'Jumlah Bid',
      key: 'bidCount',
      sortable: true,
      render: (p) => (
        <span className="font-semibold text-sm text-slate-700">{p.bidCount}</span>
      ),
    },
    {
      label: 'Bid Terendah',
      key: 'lowestBid',
      sortable: true,
      render: (p) => (
        <span className="text-sm text-emerald-600 font-semibold">
          {p.lowestBid > 0 ? formatRupiah(p.lowestBid) : '-'}
        </span>
      ),
    },
    {
      label: 'Bid Tertinggi',
      key: null,
      sortable: false,
      render: (p) => (
        <span className="text-sm text-red-500 font-medium">
          {p.highestBid > 0 ? formatRupiah(p.highestBid) : '-'}
        </span>
      ),
    },
    {
      label: 'Progress',
      key: 'progress',
      sortable: true,
      render: (p) => (
        <div className="space-y-1 min-w-[120px]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{p.progress}%</span>
            <span className="text-slate-400">{p.milestonesCompleted}/{p.milestonesTotal}</span>
          </div>
          <Progress value={p.progress} className="h-2" />
        </div>
      ),
    },
    {
      label: 'Aksi',
      key: null,
      sortable: false,
      render: (p) => (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          onClick={() => window.open(`/projects/${p.id}`, '_blank')}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Lihat Detail
        </Button>
      ),
    },
  ];

  return (
    <Card className="border shadow-lg overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
              <GitCompare className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Perbandingan Proyek</CardTitle>
              <p className="text-sm text-slate-500">
                Membandingkan {projects.length} proyek
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-6 pt-4">
        {/* Recommendation banner */}
        {comparison?.recommendedProject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mb-5 p-4 bg-gradient-to-r from-primary/5 via-teal-50/50 to-emerald-50/50 border border-primary/20 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-semibold text-sm text-primary">Rekomendasi</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold">{comparison.recommendedProject.title}</span> — {comparison.recommendedProject.reason}
            </p>
          </motion.div>
        )}

        {/* Scrollable table for mobile */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[130px] min-w-[130px] sticky left-0 bg-slate-50 z-10 font-semibold text-xs text-slate-600">
                  Perbandingan
                </TableHead>
                {sortedProjects.map((project) => (
                  <TableHead key={project.id} className="min-w-[160px]">
                    <div className="space-y-1.5">
                      <Badge variant="secondary" className="text-xs font-medium">{project.category}</Badge>
                      <p className="font-semibold text-xs whitespace-normal text-slate-700">{project.title}</p>
                    </div>
                  </TableHead>
                ))}
                {/* VS column for 2+ projects */}
                {sortedProjects.length >= 2 && (
                  <TableHead className="w-10 text-center">
                    <span className="text-[10px] font-bold text-slate-300">VS</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const isSortable = row.sortable;
                const isSorted = row.key === sortKey;

                return (
                  <TableRow
                    key={row.label}
                    className={`transition-colors duration-200 hover:bg-primary/[0.03] ${
                      index % 2 === 1 ? 'bg-slate-50/40' : ''
                    }`}
                  >
                    <TableCell className="font-medium text-xs sticky left-0 z-10 whitespace-nowrap bg-inherit">
                      <div className="flex items-center gap-1.5">
                        {row.label}
                        {isSortable && (
                          <button
                            onClick={() => handleSort(row.key!)}
                            className={`p-0.5 rounded transition-colors ${
                              isSorted ? 'text-primary' : 'text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        )}
                        {isSorted && (
                          <span className="text-[9px] font-bold text-primary">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {sortedProjects.map((project) => {
                      // Find best value for highlighting
                      const isBest = (() => {
                        if (!row.sortable || !row.key || sortedProjects.length < 2) return false;
                        const vals = sortedProjects
                          .map(p => {
                            switch (row.key) {
                              case 'budget': return p.budget;
                              case 'duration': return p.duration || 0;
                              case 'progress': return p.progress;
                              case 'bidCount': return p.bidCount;
                              case 'lowestBid': return p.lowestBid;
                              default: return 0;
                            }
                          })
                          .filter(v => v > 0);
                        if (vals.length === 0) return false;
                        const best = row.key === 'budget' || row.key === 'lowestBid'
                          ? Math.min(...vals)
                          : Math.max(...vals);
                        const currentVal = (() => {
                          switch (row.key) {
                            case 'budget': return project.budget;
                            case 'duration': return project.duration || 0;
                            case 'progress': return project.progress;
                            case 'bidCount': return project.bidCount;
                            case 'lowestBid': return project.lowestBid;
                            default: return 0;
                          }
                        })();
                        return currentVal === best && currentVal > 0;
                      })();

                      return (
                        <TableCell key={project.id} className={isBest ? 'bg-emerald-50/50' : ''}>
                          <div className={isBest ? 'relative' : ''}>
                            {row.render(project)}
                            {isBest && (
                              <span className="absolute -top-1 -right-1 text-[8px] text-emerald-500 font-bold bg-emerald-100 rounded-full px-1">
                                ✓
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                    {sortedProjects.length >= 2 && (
                      <TableCell className="p-1 text-center">
                        <span className="text-[10px] text-slate-200 font-bold">VS</span>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}

              {/* Recommendation row */}
              {comparison?.recommendedProject && (
                <TableRow className="bg-gradient-to-r from-primary/5 to-emerald-50/30 hover:from-primary/5 hover:to-emerald-50/30">
                  <TableCell className="font-medium text-xs sticky left-0 bg-inherit z-10 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-3 w-3 text-primary" />
                      <span className="font-semibold">Rekomendasi</span>
                    </div>
                  </TableCell>
                  {sortedProjects.map((project) => (
                    <TableCell key={project.id}>
                      {project.id === comparison.recommendedProject!.id ? (
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                        >
                          <Badge className="bg-gradient-to-r from-primary to-teal-600 text-white text-xs font-semibold shadow-sm">
                            <Sparkles className="h-3 w-3 mr-1" /> Pilihan Terbaik
                          </Badge>
                        </motion.div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                  ))}
                  {sortedProjects.length >= 2 && <TableCell className="p-1" />}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Comparison summary cards */}
        <AnimatePresence>
          {comparison && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 px-2"
            >
              {comparison.cheapestProject && (
                <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">Terhemat</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{comparison.cheapestProject.title}</p>
                  <p className="text-xs text-slate-500 font-medium">{formatRupiah(comparison.cheapestProject.budget)}</p>
                </div>
              )}
              {comparison.mostBidsProject && (
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <span className="text-xs font-semibold text-amber-700">Terpopuler</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{comparison.mostBidsProject.title}</p>
                  <p className="text-xs text-slate-500 font-medium">{comparison.mostBidsProject.bidCount} bid</p>
                </div>
              )}
              {comparison.closestToDeadline && (
                <div className="p-3.5 bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                    <span className="text-xs font-semibold text-rose-700">Deadline Terdekat</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{comparison.closestToDeadline.title}</p>
                  <p className="text-xs text-slate-500 font-medium">{comparison.closestToDeadline.daysLeft} hari lagi</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
