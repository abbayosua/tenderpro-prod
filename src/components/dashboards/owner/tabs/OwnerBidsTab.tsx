'use client';

import { useMemo } from 'react';
import { Card, CardContent, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ScrollArea } from '@/components/ui';
import { FileText, Building2, Star, CheckCircle, Heart, Scale, Zap } from 'lucide-react';
import { formatRupiah, calculateMatchScore } from '@/lib/helpers';
import { Contractor } from '@/types';
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
        bids = [...bids].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
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
          {selectedBidsForCompare.length >= 2 && (
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={onShowCompare}>
              <Scale className="h-4 w-4 mr-2" /> Bandingkan ({selectedBidsForCompare.length})
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {filteredAndSortedBids.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Belum ada penawaran masuk</p>
            </div>
          ) : (
            filteredAndSortedBids.map(bid => {
              const projectData = bid.projectData;
              const matchScore = calculateMatchScore(
                bid.contractor as unknown as Contractor,
                projectData?.category || '',
                projectData?.budget || 0
              );
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
                    <p className="text-xs text-slate-400">Untuk: {projectData?.title}</p>
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
  );
}
