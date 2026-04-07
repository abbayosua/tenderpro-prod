'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, Building2, CheckCircle, Star, Zap, Calendar, Trophy, X as XIcon, ChevronRight, Users, Clock } from 'lucide-react';
import { Bid, Contractor } from '@/types';
import { formatRupiah, calculateMatchScore } from '@/lib/helpers';
import { motion, AnimatePresence } from 'framer-motion';

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : star <= rating
              ? 'text-amber-300 fill-amber-300'
              : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

// Confetti particles for winner celebration
function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#8b5cf6'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const startX = 40 + Math.random() * 20;

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-sm pointer-events-none"
      style={{ backgroundColor: color, left: `${startX}%`, top: '20%' }}
      initial={{ y: 0, x: 0, rotate: 0, scale: 0, opacity: 1 }}
      animate={{
        y: [0, 80, 180],
        x: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 120],
        rotate: [0, 360, 720],
        scale: [0, 1.2, 0.5],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
    />
  );
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
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const selectedIds = selectedBids || selectedBidIds || [];
  const handleAccept = onAccept || onAcceptBid || (() => {});
  const handleReject = onReject || onRejectBid || (() => {});

  const bidsToCompare = (bids || []).filter(b => selectedIds.includes(b.id));

  const lowestPrice = bidsToCompare.length > 0 ? Math.min(...bidsToCompare.map(b => b.price)) : 0;
  const highestPrice = bidsToCompare.length > 0 ? Math.max(...bidsToCompare.map(b => b.price)) : 1;
  const highestRating = bidsToCompare.length > 0 ? Math.max(...bidsToCompare.map(b => b.contractor?.rating || 0)) : 0;
  const maxDuration = bidsToCompare.length > 0 ? Math.max(...bidsToCompare.map(b => b.duration)) : 1;
  const shortestDuration = bidsToCompare.length > 0 ? Math.min(...bidsToCompare.map(b => b.duration)) : 0;

  const bestPriceBidId = bidsToCompare.find(b => b.price === lowestPrice)?.id;
  const highestRatingBidId = bidsToCompare.find(b => (b.contractor?.rating || 0) === highestRating)?.id;
  const shortestDurationBidId = bidsToCompare.find(b => b.duration === shortestDuration)?.id;

  // Determine recommended bid (highest match score)
  const getRecommendedBidId = () => {
    if (bidsToCompare.length === 0) return null;
    let bestScore = -1;
    let bestId = '';
    bidsToCompare.forEach(b => {
      const score = calculateMatchScore(b.contractor as unknown as Contractor, projectCategory, projectBudget);
      if (score > bestScore) {
        bestScore = score;
        bestId = b.id;
      }
    });
    return bestId;
  };

  const recommendedBidId = getRecommendedBidId();

  const handleWinnerSelect = (bidId: string) => {
    setWinnerId(bidId);
    handleAccept(bidId);
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.07, duration: 0.3, ease: 'easeOut' },
    }),
  };

  // Comparison bar component
  function ComparisonBar({ value, max, color, invert = false }: { value: number; max: number; color: string; invert?: boolean }) {
    const percentage = max > 0 ? Math.max(5, (value / max) * 100) : 0;
    return (
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: invert ? `${100 - percentage}%` : `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary via-teal-700 to-emerald-800 px-6 py-6 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Perbandingan Penawaran</DialogTitle>
              <DialogDescription className="text-white/70 mt-0.5">
                {bidsToCompare.length >= 2
                  ? `Membandingkan ${bidsToCompare.length} penawaran kontraktor`
                  : 'Pilih minimal 2 penawaran untuk dibandingkan'}
              </DialogDescription>
            </div>
          </div>
          {recommendedBidId && bidsToCompare.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-300" />
              Rekomendasi: {bidsToCompare.find(b => b.id === recommendedBidId)?.contractor?.name || '—'}
            </motion.div>
          )}
        </div>

        <div className="px-6 pb-6 pt-5">
          <AnimatePresence>
            {bidsToCompare.length < 2 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center">
                  <Scale className="h-10 w-10 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-600 text-lg">Pilih minimal 2 penawaran</p>
                <p className="text-sm text-slate-400 mt-1">Centang penawaran yang ingin dibandingkan dari daftar</p>
                <div className="flex items-center justify-center gap-6 mt-6">
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs">Kontraktor A</span>
                  </div>
                  <div className="text-slate-300 text-xs font-medium">VS</div>
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs">Kontraktor B</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full">
                  {/* Header row with gradient */}
                  <thead>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b-2 border-slate-200"
                    >
                      <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-gradient-to-r from-slate-50 to-white w-40">
                        Kriteria
                      </th>
                      {bidsToCompare.map((bid, colIdx) => {
                        const isRecommended = bid.id === recommendedBidId;
                        const isWinner = bid.id === winnerId;
                        return (
                          <motion.th
                            key={bid.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: colIdx * 0.08 }}
                            className={`p-3 text-center relative ${
                              isRecommended
                                ? 'bg-gradient-to-b from-primary/5 to-teal-50/50'
                                : 'bg-gradient-to-b from-slate-50 to-white'
                            }`}
                          >
                            {/* Gradient top border for recommended */}
                            {isRecommended && (
                              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-teal-500 to-emerald-500" />
                            )}
                            <div className="flex flex-col items-center">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 ${
                                isWinner
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-200 scale-110'
                                  : isRecommended
                                  ? 'bg-gradient-to-br from-primary to-teal-600 shadow-md shadow-primary/20'
                                  : 'bg-slate-100'
                              }`}>
                                <Building2 className={`h-7 w-7 ${isWinner ? 'text-white' : isRecommended ? 'text-white' : 'text-slate-400'}`} />
                              </div>
                              <span className="font-bold text-sm text-slate-800">{bid.contractor?.name || 'Unknown'}</span>
                              <span className="text-xs text-slate-400">{bid.contractor?.company || '-'}</span>
                              {isRecommended && !isWinner && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3, type: 'spring' }}
                                >
                                  <Badge className="mt-2 bg-gradient-to-r from-primary to-teal-600 text-white border-0 text-[10px] font-bold px-2.5 py-0.5 shadow-sm">
                                    <Trophy className="h-2.5 w-2.5 mr-1" /> Rekomendasi
                                  </Badge>
                                </motion.div>
                              )}
                              {isWinner && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', damping: 12 }}
                                  className="relative mt-2"
                                >
                                  <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 text-[10px] font-bold px-2.5 py-0.5 shadow-md">
                                    <Trophy className="h-2.5 w-2.5 mr-1" /> Pemenang!
                                  </Badge>
                                  {/* Confetti */}
                                  {Array.from({ length: 16 }).map((_, i) => (
                                    <ConfettiParticle key={i} delay={i * 0.05} />
                                  ))}
                                </motion.div>
                              )}
                              <div className="flex gap-1 mt-1.5 flex-wrap justify-center">
                                {bid.id === bestPriceBidId && (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold px-2 py-0.5">
                                    Harga Terbaik
                                  </Badge>
                                )}
                                {bid.id === highestRatingBidId && (
                                  <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] font-bold px-2 py-0.5">
                                    Rating Tertinggi
                                  </Badge>
                                )}
                                {bid.id === shortestDurationBidId && (
                                  <Badge className="bg-teal-100 text-teal-700 border-0 text-[10px] font-bold px-2 py-0.5">
                                    Durasi Tercepat
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </motion.th>
                        );
                      })}
                    </motion.tr>
                  </thead>
                  <tbody>
                    {/* Price Row */}
                    <motion.tr
                      custom={0}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Penawaran</span>
                      </td>
                      {bidsToCompare.map((bid) => {
                        const isBest = bid.id === bestPriceBidId;
                        return (
                          <td key={bid.id} className={`p-3 text-center ${isBest ? 'bg-emerald-50/50' : ''}`}>
                            <span className={`font-bold text-base ${isBest ? 'text-emerald-700' : 'text-primary'}`}>
                              {formatRupiah(bid.price)}
                            </span>
                            {isBest && (
                              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">💰 Terendah</div>
                            )}
                            <div className="mt-2">
                              <ComparisonBar value={bid.price} max={highestPrice} color={isBest ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-primary/60 to-primary/40'} />
                            </div>
                          </td>
                        );
                      })}
                    </motion.tr>

                    {/* Duration Row */}
                    <motion.tr
                      custom={1}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Durasi Pengerjaan</span>
                      </td>
                      {bidsToCompare.map((bid) => {
                        const isBest = bid.id === shortestDurationBidId;
                        return (
                          <td key={bid.id} className={`p-3 text-center ${isBest ? 'bg-emerald-50/50' : ''}`}>
                            <div className="flex items-center justify-center gap-1.5">
                              <Clock className={`h-4 w-4 ${isBest ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <span className={`font-semibold text-sm ${isBest ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {bid.duration} hari
                              </span>
                            </div>
                            {isBest && (
                              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">⚡ Tercepat</div>
                            )}
                            <div className="mt-2">
                              <ComparisonBar value={bid.duration} max={maxDuration} color={isBest ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-teal-400/60 to-teal-400/40'} />
                            </div>
                          </td>
                        );
                      })}
                    </motion.tr>

                    {/* Rating Row */}
                    <motion.tr
                      custom={2}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rating Kontraktor</span>
                      </td>
                      {bidsToCompare.map((bid) => {
                        const isBest = bid.id === highestRatingBidId;
                        return (
                          <td key={bid.id} className={`p-3 text-center ${isBest ? 'bg-amber-50/50' : ''}`}>
                            <div className="flex flex-col items-center gap-1">
                              <StarRating rating={bid.contractor.rating || 0} />
                              <span className={`font-bold text-sm ${isBest ? 'text-amber-700' : 'text-slate-700'}`}>
                                {bid.contractor.rating || '-'}
                              </span>
                            </div>
                            {isBest && (
                              <div className="text-[10px] text-amber-600 font-bold mt-0.5">⭐ Tertinggi</div>
                            )}
                            <div className="mt-2">
                              <ComparisonBar value={bid.contractor.rating || 0} max={5} color={isBest ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-amber-300/60 to-amber-300/40'} />
                            </div>
                          </td>
                        );
                      })}
                    </motion.tr>

                    {/* Completed Projects Row */}
                    <motion.tr
                      custom={3}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proyek Selesai</span>
                      </td>
                      {bidsToCompare.map((bid) => (
                        <td key={bid.id} className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-sm text-slate-700">{bid.contractor.totalProjects || 0} proyek</span>
                          </div>
                        </td>
                      ))}
                    </motion.tr>

                    {/* Verification Row */}
                    <motion.tr
                      custom={4}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Verifikasi</span>
                      </td>
                      {bidsToCompare.map((bid) => (
                        <td key={bid.id} className="p-3 text-center">
                          {bid.contractor.isVerified ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-semibold shadow-sm">
                              <CheckCircle className="h-3 w-3 mr-1" /> Terverifikasi
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Belum Verifikasi</Badge>
                          )}
                        </td>
                      ))}
                    </motion.tr>

                    {/* Match Score Row */}
                    <motion.tr
                      custom={5}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Match Score</span>
                      </td>
                      {bidsToCompare.map((bid) => {
                        const score = calculateMatchScore(bid.contractor as unknown as Contractor, projectCategory, projectBudget);
                        const isBest = bid.id === recommendedBidId;
                        return (
                          <td key={bid.id} className={`p-3 text-center ${isBest ? 'bg-primary/5' : ''}`}>
                            <div className="flex items-center justify-center gap-1.5">
                              <Zap className={`h-4 w-4 ${isBest ? 'text-primary' : 'text-slate-400'}`} />
                              <span className={`font-bold text-base ${isBest ? 'text-primary' : 'text-slate-600'}`}>{score}%</span>
                            </div>
                            <div className="mt-2">
                              <ComparisonBar value={score} max={100} color={isBest ? 'bg-gradient-to-r from-primary to-teal-400' : 'bg-gradient-to-r from-slate-300 to-slate-200'} />
                            </div>
                          </td>
                        );
                      })}
                    </motion.tr>

                    {/* Proposal Row */}
                    <motion.tr
                      custom={6}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proposal</span>
                      </td>
                      {bidsToCompare.map((bid) => (
                        <td key={bid.id} className="p-3">
                          <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">{bid.proposal}</p>
                        </td>
                      ))}
                    </motion.tr>
                  </tbody>

                  {/* Actions Footer */}
                  <tfoot>
                    <motion.tr
                      custom={7}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className="border-t-2 border-slate-200"
                    >
                      <td className="p-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</span>
                      </td>
                      {bidsToCompare.map((bid) => {
                        const isRecommended = bid.id === recommendedBidId;
                        const isWinner = bid.id === winnerId;
                        return (
                          <td key={bid.id} className="p-3 text-center">
                            <div className="flex flex-col gap-2">
                              {isWinner ? (
                                <div className="w-full h-10 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-white flex items-center justify-center gap-1.5 text-xs font-bold shadow-md">
                                  <Trophy className="h-3.5 w-3.5" /> Dipilih!
                                </div>
                              ) : (
                                <Button
                                  className={`w-full h-10 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                                    isRecommended
                                      ? 'bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-md shadow-primary/20'
                                      : 'bg-primary hover:bg-primary/90 text-white'
                                  }`}
                                  onClick={() => { handleWinnerSelect(bid.id); onOpenChange(false); }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                  {isRecommended ? 'Pilih Pemenang' : 'Pilih'}
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className="w-full h-9 text-xs border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
                                onClick={() => { handleReject(bid.id); onOpenChange(false); }}
                              >
                                <XIcon className="h-3.5 w-3.5 mr-1.5" />
                                Tolak
                              </Button>
                            </div>
                          </td>
                        );
                      })}
                    </motion.tr>
                  </tfoot>
                </table>
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
