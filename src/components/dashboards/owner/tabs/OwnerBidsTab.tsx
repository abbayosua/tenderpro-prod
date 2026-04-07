'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ScrollArea } from '@/components/ui';
import { FileText, Building2, Star, CheckCircle, Heart, Scale, Zap, X, ArrowRight } from 'lucide-react';
import { formatRupiah, calculateMatchScore } from '@/lib/helpers';
import { Contractor } from '@/types';
import { BidComparison } from '../BidComparison';
import type { OwnerBidsTabProps } from './types';

export function OwnerBidsTab({
  ownerStats,
  selectedBidsForCompare,
  toggleBidSelection,
  onShowCompare,
  onAcceptBid,
  onRejectBid,
  onAddFavorite,
  filterBidProject,
  setFilterBidProject,
  sortBidsBy,
  setSortBidsBy,
}: OwnerBidsTabProps) {
  const projects = ownerStats?.projects ?? [];
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonProjectId, setComparisonProjectId] = useState<string | null>(null);

  // Get all bids with project info, then filter and sort
  const filteredAndSortedBids = useMemo(() => {
    // Get all bids from projects that are OPEN
    let bids = projects
      .filter(p => p.status === 'OPEN' && p.bids.length > 0)
      .flatMap(project =>
        project.bids.map(bid => ({
          ...bid,
          projectData: project,
        }))
      );

    // Filter by project
    if (filterBidProject !== 'all') {
      bids = bids.filter(bid => bid.projectData.id === filterBidProject);
    }

    // Sort bids
    switch (sortBidsBy) {
      case 'newest':
        bids = [...bids].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
      case 'lowest':
        bids = [...bids].sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        bids = [...bids].sort((a, b) => (b.contractor.rating || 0) - (a.contractor.rating || 0));
        break;
    }

    return bids;
  }, [projects, filterBidProject, sortBidsBy]);

  // Group bids by project for comparison
  const projectsWithBids = useMemo(() => {
    const projectMap = new Map<string, { project: typeof projects[0]; bidCount: number }>();
    for (const p of projects) {
      if (p.status === 'OPEN' && p.bids.length >= 2) {
        projectMap.set(p.id, { project: p, bidCount: p.bids.length });
      }
    }
    return Array.from(projectMap.entries()).map(([id, data]) => ({
      id,
      title: data.project.title,
      bidCount: data.bidCount,
    }));
  }, [projects]);

  // Get bids for the selected comparison project
  const comparisonBids = useMemo(() => {
    if (!comparisonProjectId) return [];
    const project = projects.find(p => p.id === comparisonProjectId);
    if (!project) return [];
    return project.bids.map(bid => ({
      id: bid.id,
      contractorId: bid.contractorId,
      contractorName: bid.contractor.name,
      contractorRating: bid.contractor.rating || 0,
      contractorVerified: bid.contractor.isVerified || false,
      price: bid.price,
      duration: bid.duration,
      proposal: bid.proposal,
      status: bid.status,
    }));
  }, [comparisonProjectId, projects]);

  // Handle select winner from BidComparison
  const handleSelectWinner = (bidId: string) => {
    onAcceptBid(bidId);
    setComparisonMode(false);
    setComparisonProjectId(null);
  };

  // Handle "Bandingkan Penawaran" button click
  const handleCompareClick = (projectId?: string) => {
    if (projectId) {
      setComparisonProjectId(projectId);
      setComparisonMode(true);
    } else {
      setComparisonMode(!comparisonMode);
      if (comparisonMode) {
        setComparisonProjectId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Comparison Mode Widget */}
      {comparisonMode && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Bandingkan Penawaran</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setComparisonMode(false); setComparisonProjectId(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {!comparisonProjectId ? (
              <div className="space-y-2">
                <p className="text-sm text-purple-700 mb-3">Pilih proyek untuk membandingkan penawaran masuk:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {projectsWithBids.map(p => (
                    <button
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-sm transition-all"
                      onClick={() => handleCompareClick(p.id)}
                    >
                      <div className="text-left">
                        <p className="font-medium text-sm text-slate-800 line-clamp-1">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.bidCount} penawaran</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-purple-400 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
                {projectsWithBids.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Belum ada proyek dengan 2+ penawaran</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Button variant="outline" size="sm" onClick={() => setComparisonProjectId(null)}>
                    ← Kembali
                  </Button>
                  <span className="text-sm text-purple-700">
                    Membandingkan penawaran untuk: <strong>{projects.find(p => p.id === comparisonProjectId)?.title}</strong>
                  </span>
                </div>
                <BidComparison
                  projectId={comparisonProjectId}
                  bids={comparisonBids}
                  onSelectWinner={handleSelectWinner}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Select value={filterBidProject} onValueChange={setFilterBidProject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter Proyek" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Proyek</SelectItem>
                  {projects.filter(p => p.status === 'OPEN').map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBidsBy} onValueChange={(value) => setSortBidsBy(value as 'newest' | 'lowest' | 'rating')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="lowest">Harga Terendah</SelectItem>
                  <SelectItem value="rating">Rating Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {projectsWithBids.length > 0 && (
                <Button
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => handleCompareClick()}
                >
                  <Scale className="h-4 w-4 mr-2" /> Bandingkan Penawaran
                </Button>
              )}
              {selectedBidsForCompare.length >= 2 && (
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={onShowCompare}>
                  <Scale className="h-4 w-4 mr-2" /> Bandingkan ({selectedBidsForCompare.length})
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-96">
            {filteredAndSortedBids.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium mb-1">Belum ada penawaran masuk</p>
                <p className="text-sm text-slate-400">Penawaran dari kontraktor akan muncul di sini setelah mereka mengajukan bid</p>
              </div>
            ) : (
              filteredAndSortedBids.map(bid => {
                const projectData = bid.projectData;
                const matchScore = calculateMatchScore(
                  bid.contractor as unknown as Contractor,
                  projectData?.category || '',
                  projectData?.budget || 0
                );
                const hasCompareEligible = projectData && projectData.bids.length >= 2;
                return (
                  <div key={bid.id} className={`border rounded-lg p-4 mb-3 hover:shadow-sm ${selectedBidsForCompare.includes(bid.id) ? 'border-purple-400 bg-purple-50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 accent-purple-600"
                          checked={selectedBidsForCompare.includes(bid.id)}
                          onChange={() => toggleBidSelection(bid.id)}
                          disabled={!selectedBidsForCompare.includes(bid.id) && selectedBidsForCompare.length >= 3}
                        />
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium">{bid.contractor.name}</p>
                          <p className="text-sm text-slate-500">{bid.contractor.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{formatRupiah(bid.price)}</p>
                        <p className="text-sm text-slate-500">{bid.duration} hari kerja</p>
                      </div>
                    </div>
                    {bid.contractor.rating && (
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{bid.contractor.rating}</span>
                          <span className="text-sm text-slate-500">({bid.contractor.totalProjects} proyek)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-600">{matchScore}% Cocok</span>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{bid.proposal}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400">Untuk: {projectData?.title}</p>
                        {hasCompareEligible && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 h-6 px-2 text-xs"
                            onClick={() => handleCompareClick(projectData.id)}
                          >
                            <Scale className="h-3 w-3 mr-1" /> Bandingkan
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => onAcceptBid(bid.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Terima
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onRejectBid(bid.id)}>Tolak</Button>
                        <Button size="sm" variant="ghost" onClick={() => onAddFavorite(bid.contractor.id)}>
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
