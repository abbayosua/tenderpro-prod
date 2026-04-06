'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, GitCompare, Trophy, AlertTriangle, Clock, Sparkles, Loader2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatRupiah, getStatusLabel, getStatusColor } from '@/lib/helpers';

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

export function ProjectCompareTable({ projectIds, onClose }: ProjectCompareTableProps) {
  const [projects, setProjects] = useState<ComparedProject[]>([]);
  const [comparison, setComparison] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (projectIds.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <GitCompare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Pilih minimal 2 proyek untuk dibandingkan</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-slate-500">Memuat perbandingan proyek...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-500">{error || 'Tidak ada data proyek'}</p>
        </CardContent>
      </Card>
    );
  }

  // Comparison rows configuration
  const rows: Array<{
    label: string;
    render: (project: ComparedProject) => React.ReactNode;
  }> = [
    {
      label: 'Nama Proyek',
      render: (p) => <span className="font-semibold text-sm">{p.title}</span>,
    },
    {
      label: 'Kategori',
      render: (p) => (
        <Badge variant="outline" className="text-xs">{p.category}</Badge>
      ),
    },
    {
      label: 'Lokasi',
      render: (p) => <span className="text-sm">{p.location}</span>,
    },
    {
      label: 'Anggaran',
      render: (p) => (
        <span className="font-medium text-sm text-primary">{formatRupiah(p.budget)}</span>
      ),
    },
    {
      label: 'Durasi',
      render: (p) => <span className="text-sm">{p.duration ? `${p.duration} hari` : '-'}</span>,
    },
    {
      label: 'Status',
      render: (p) => (
        <Badge className={`text-xs ${getStatusColor(p.status)}`}>
          {getStatusLabel(p.status)}
        </Badge>
      ),
    },
    {
      label: 'Jumlah Bid',
      render: (p) => (
        <span className="font-medium text-sm">{p.bidCount}</span>
      ),
    },
    {
      label: 'Bid Terendah',
      render: (p) => (
        <span className="text-sm text-emerald-600 font-medium">
          {p.lowestBid > 0 ? formatRupiah(p.lowestBid) : '-'}
        </span>
      ),
    },
    {
      label: 'Bid Tertinggi',
      render: (p) => (
        <span className="text-sm text-red-500 font-medium">
          {p.highestBid > 0 ? formatRupiah(p.highestBid) : '-'}
        </span>
      ),
    },
    {
      label: 'Progress',
      render: (p) => (
        <div className="space-y-1 min-w-[120px]">
          <div className="flex items-center justify-between text-xs">
            <span>{p.progress}%</span>
            <span className="text-slate-400">{p.milestonesCompleted}/{p.milestonesTotal}</span>
          </div>
          <Progress value={p.progress} className="h-2" />
        </div>
      ),
    },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GitCompare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Perbandingan Proyek</CardTitle>
              <p className="text-sm text-slate-500">
                Membandingkan {projects.length} proyek
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        {/* Recommendation banner */}
        {comparison?.recommendedProject && (
          <div className="mx-4 mb-4 p-3 bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-primary">Rekomendasi</span>
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-medium">{comparison.recommendedProject.title}</span> — {comparison.recommendedProject.reason}
            </p>
          </div>
        )}

        {/* Scrollable table for mobile */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px] min-w-[130px] sticky left-0 bg-white z-10 font-semibold text-xs">
                  Perbandingan
                </TableHead>
                {projects.map((project) => (
                  <TableHead key={project.id} className="min-w-[160px]">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">{project.category}</Badge>
                      <p className="font-semibold text-xs whitespace-normal">{project.title}</p>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-xs sticky left-0 bg-white z-10 whitespace-nowrap">
                    {row.label}
                  </TableCell>
                  {projects.map((project) => (
                    <TableCell key={project.id}>{row.render(project)}</TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Recommendation row */}
              {comparison?.recommendedProject && (
                <TableRow className="bg-primary/5">
                  <TableCell className="font-medium text-xs sticky left-0 bg-primary/5 z-10 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-primary" />
                      Rekomendasi
                    </div>
                  </TableCell>
                  {projects.map((project) => (
                    <TableCell key={project.id}>
                      {project.id === comparison.recommendedProject!.id ? (
                        <Badge className="bg-primary text-white text-xs">
                          <Sparkles className="h-3 w-3 mr-1" /> Pilihan Terbaik
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Comparison summary cards */}
        {comparison && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 px-2">
            {comparison.cheapestProject && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Terhemat</span>
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{comparison.cheapestProject.title}</p>
                <p className="text-xs text-slate-500">{formatRupiah(comparison.cheapestProject.budget)}</p>
              </div>
            )}
            {comparison.mostBidsProject && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">Terpopuler</span>
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{comparison.mostBidsProject.title}</p>
                <p className="text-xs text-slate-500">{comparison.mostBidsProject.bidCount} bid</p>
              </div>
            )}
            {comparison.closestToDeadline && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Deadline Terdekat</span>
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{comparison.closestToDeadline.title}</p>
                <p className="text-xs text-slate-500">{comparison.closestToDeadline.daysLeft} hari lagi</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
