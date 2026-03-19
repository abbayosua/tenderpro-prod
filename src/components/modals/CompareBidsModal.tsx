'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, Building2, CheckCircle, Star, Zap } from 'lucide-react';
import { Bid, Contractor } from '@/types';
import { formatRupiah, calculateMatchScore } from '@/lib/helpers';

interface CompareBidsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBids?: string[];
  selectedBidIds?: string[];
  bids?: Bid[];
  projectCategory?: string;
  projectBudget?: number;
  onAccept?: (bidId: string) => void;
  onAcceptBid?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  onRejectBid?: (bidId: string) => void;
}

export function CompareBidsModal({
  open,
  onOpenChange,
  selectedBids,
  selectedBidIds,
  bids = [],
  projectCategory = '',
  projectBudget = 0,
  onAccept,
  onAcceptBid,
  onReject,
  onRejectBid,
}: CompareBidsModalProps) {
  // Support both prop naming conventions
  const selectedIds = selectedBids || selectedBidIds || [];
  const handleAccept = onAccept || onAcceptBid || (() => {});
  const handleReject = onReject || onRejectBid || (() => {});

  const bidsToCompare = (bids || []).filter(b => selectedIds.includes(b.id));

  // Calculate actual best price and highest rating
  const lowestPrice = bidsToCompare.length > 0 ? Math.min(...bidsToCompare.map(b => b.price)) : 0;
  const highestRating = bidsToCompare.length > 0 ? Math.max(...bidsToCompare.map(b => b.contractor?.rating || 0)) : 0;

  // Find the bid IDs with lowest price and highest rating
  const bestPriceBidId = bidsToCompare.find(b => b.price === lowestPrice)?.id;
  const highestRatingBidId = bidsToCompare.find(b => (b.contractor?.rating || 0) === highestRating)?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Scale className="h-5 w-5 text-purple-600" />
            Perbandingan Penawaran
          </DialogTitle>
          <DialogDescription>Bandingkan penawaran dari berbagai kontraktor</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          {bidsToCompare.length < 2 ? (
            <p className="text-center py-8 text-slate-500">Pilih minimal 2 penawaran untuk dibandingkan</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left bg-slate-50 font-medium">Kriteria</th>
                  {bidsToCompare.map((bid) => (
                    <th key={bid.id} className="p-3 text-center bg-slate-50">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                          <Building2 className="h-6 w-6 text-purple-600" />
                        </div>
                        <span className="font-semibold">{bid.contractor?.name || 'Unknown'}</span>
                        <span className="text-xs text-slate-500">{bid.contractor?.company || '-'}</span>
                        <div className="flex gap-1 mt-2 flex-wrap justify-center">
                          {bid.id === bestPriceBidId && (
                            <Badge className="bg-primary/10 text-primary text-xs">Harga Terbaik</Badge>
                          )}
                          {bid.id === highestRatingBidId && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">Rating Tertinggi</Badge>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">Harga Penawaran</td>
                  {bidsToCompare.map((bid) => (
                    <td key={bid.id} className="p-3 text-center">
                      <span className="font-bold text-lg text-primary">{formatRupiah(bid.price)}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b bg-slate-50">
                  <td className="p-3 font-medium">Durasi Pengerjaan</td>
                  {bidsToCompare.map((bid) => (
                    <td key={bid.id} className="p-3 text-center">
                      <span className="font-medium">{bid.duration} hari</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Rating</td>
                  {bidsToCompare.map((bid) => (
                    <td key={bid.id} className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{bid.contractor.rating || '-'}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b bg-slate-50">
                  <td className="p-3 font-medium">Proyek Selesai</td>
                  {bidsToCompare.map((bid) => (
                    <td key={bid.id} className="p-3 text-center">
                      <span className="font-medium">{bid.contractor.totalProjects || 0} proyek</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Status Verifikasi</td>
                  {bidsToCompare.map((bid) => (
                    <td key={bid.id} className="p-3 text-center">
                      {bid.contractor.isVerified ? (
                        <Badge className="bg-primary"><CheckCircle className="h-3 w-3 mr-1" /> Terverifikasi</Badge>
                      ) : (
                        <Badge variant="secondary">Belum Verifikasi</Badge>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b bg-slate-50">
                  <td className="p-3 font-medium">Match Score</td>
                  {bidsToCompare.map((bid) => {
                    const score = calculateMatchScore(bid.contractor as unknown as Contractor, projectCategory, projectBudget);
                    return (
                      <td key={bid.id} className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="font-bold text-purple-600">{score}%</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-medium">Proposal</td>
                  {bidsToCompare.map((bid) => (
                    <td key={bid.id} className="p-3">
                      <p className="text-sm text-slate-600 line-clamp-4">{bid.proposal}</p>
                    </td>
                  ))}
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td className="p-3 font-medium">Aksi</td>
                  {bidsToCompare.map((bid) => (
                    <td key={bid.id} className="p-3 text-center">
                      <div className="flex flex-col gap-2">
                        <Button className="bg-primary hover:bg-primary/90 w-full" onClick={() => { handleAccept(bid.id); onOpenChange(false); }}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Pilih
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => { handleReject(bid.id); onOpenChange(false); }}>
                          Tolak
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
