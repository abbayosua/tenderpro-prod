'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Avatar, AvatarFallback } from '@/components/ui';
import { Scale, Star, Trophy, CheckCircle, ArrowRight, Quote, Clock, Zap, Medal, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatRupiah, truncateText } from '@/lib/helpers';

interface BidData {
  id: string;
  contractorId: string;
  contractorName: string;
  contractorAvatar?: string;
  contractorRating: number;
  contractorVerified: boolean;
  price: number;
  duration: number;
  proposal: string;
  status: string;
}

interface BidComparisonProps {
  projectId: string;
  bids: BidData[];
  onSelectWinner?: (bidId: string) => void;
  onCompareAll?: () => void;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

export function BidComparison({ projectId, bids, onSelectWinner, onCompareAll }: BidComparisonProps) {
  // Sort by price ascending and take top 3
  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => a.price - b.price).slice(0, 3);
  }, [bids]);

  // Find recommended bid (lowest price with rating >= 4)
  const recommendedBidId = useMemo(() => {
    const eligible = sortedBids.filter(b => b.contractorRating >= 4 && b.status === 'PENDING');
    if (eligible.length > 0) return eligible[0].id;
    return sortedBids[0]?.id || null;
  }, [sortedBids]);

  const maxPrice = Math.max(...bids.map(b => b.price), 1);
  const minDuration = Math.min(...bids.map(b => b.duration));
  const maxDuration = Math.max(...bids.map(b => b.duration), 1);
  const maxRating = 5;

  if (bids.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Scale className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada penawaran</p>
          <p className="text-sm text-slate-400 mt-1">Penawaran dari kontraktor akan muncul di sini</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 px-6 py-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              className="p-2.5 bg-gradient-to-br from-white/15 to-white/5 rounded-xl backdrop-blur-sm border border-white/10"
            >
              <Scale className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-white text-lg">Perbandingan Penawaran</CardTitle>
              <p className="text-sm text-slate-400 mt-0.5">{bids.length} penawaran masuk &middot; 3 teratas ditampilkan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/10 border-white/20 text-white/80 text-[10px] font-medium backdrop-blur-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              Harga terendah: {formatRupiah(sortedBids[0]?.price || 0)}
            </Badge>
            {bids.length > 1 && onCompareAll && (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm gap-1.5 transition-all duration-200"
                onClick={onCompareAll}
              >
                Bandingkan Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Visual Comparison Summary Bar */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-3">Perbandingan Visual</p>
          <div className="space-y-3">
            {/* Price Comparison */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] font-medium text-slate-500">Harga</span>
              </div>
              <div className="space-y-1.5">
                {sortedBids.map((bid) => {
                  const pct = (bid.price / maxPrice) * 100;
                  const isRec = bid.id === recommendedBidId;
                  return (
                    <motion.div
                      key={bid.id}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className={`h-5 rounded-md flex items-center gap-2 ${
                        isRec
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : 'bg-gradient-to-r from-slate-200 to-slate-300'
                      } overflow-hidden`}
                    >
                      <span className={`text-[10px] font-bold px-2 truncate ${isRec ? 'text-white' : 'text-slate-600'}`}>
                        {formatRupiah(bid.price)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            {/* Duration Comparison */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-medium text-slate-500">Durasi</span>
              </div>
              <div className="space-y-1.5">
                {sortedBids.map((bid) => {
                  const pct = maxDuration > 0 ? (bid.duration / maxDuration) * 100 : 0;
                  return (
                    <motion.div
                      key={bid.id}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      className="h-4 rounded-md bg-gradient-to-r from-primary/30 to-primary/10 overflow-hidden"
                    >
                      <span className="text-[10px] font-medium px-2 text-primary">{bid.duration} hari</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedBids.map((bid, index) => {
            const isRecommended = bid.id === recommendedBidId;
            const isLowest = index === 0;
            const pricePct = maxPrice > 0 ? ((maxPrice - bid.price) / maxPrice) * 100 : 0;

            return (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -6, boxShadow: '0 16px 40px -10px rgba(0,0,0,0.18)' }}
                className={`rounded-2xl border-2 p-5 transition-all duration-300 relative overflow-hidden ${
                  isRecommended
                    ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 shadow-lg shadow-emerald-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Decorative gradient for winner */}
                {isRecommended && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-bl-full" />
                )}

                {/* Rank Number */}
                <div className="relative flex items-center justify-between mb-3">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                    index === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700' :
                    index === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600' :
                    'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Recommended Badge */}
                  {isRecommended ? (
                    <motion.div
                      initial={{ scale: 0, y: -5 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 200 }}
                    >
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold shadow-sm shadow-emerald-200">
                        <Trophy className="h-3 w-3" />
                        Direkomendasikan
                      </div>
                    </motion.div>
                  ) : isLowest ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    >
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0 font-semibold">
                        Harga Terendah
                      </Badge>
                    </motion.div>
                  ) : null}
                </div>

                {/* Contractor Info */}
                <div className="relative flex items-center gap-3 mb-4">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Avatar className={`h-11 w-11 ${isRecommended ? 'ring-2 ring-emerald-400 ring-offset-2' : 'ring-1 ring-slate-200'}`}>
                      <AvatarFallback className={`text-xs font-bold ${
                        isRecommended
                          ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {bid.contractorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{bid.contractorName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarRating rating={bid.contractorRating} />
                      <span className="text-xs text-slate-500 font-medium">{bid.contractorRating}</span>
                      {bid.contractorVerified && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Indicators */}
                <div className="relative grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Harga</p>
                    <p className={`text-sm font-bold ${isRecommended ? 'text-emerald-600' : 'text-primary'}`}>
                      {formatRupiah(bid.price)}
                    </p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - pricePct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className={`h-full rounded-full ${
                          pricePct > 30 ? 'bg-emerald-400' : pricePct > 15 ? 'bg-amber-400' : 'bg-slate-400'
                        }`}
                      />
                    </motion.div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Durasi</p>
                    <p className="text-sm font-bold text-slate-700">{bid.duration} <span className="text-xs font-normal text-slate-400">hari</span></p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${maxDuration > 0 ? ((maxDuration - bid.duration) / maxDuration) * 100 : 50}%` }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Proposal Excerpt */}
                <div className="relative pl-3 mb-4">
                  <Quote className="absolute left-0 top-0 h-3 w-3 text-slate-200" />
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">
                    {truncateText(bid.proposal, 120)}
                  </p>
                </div>

                {/* Action */}
                {isRecommended && onSelectWinner && bid.status === 'PENDING' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-200 gap-1.5 transition-all duration-200"
                      onClick={() => onSelectWinner(bid.id)}
                    >
                      <Medal className="h-4 w-4" />
                      Pilih Sebagai Pemenang
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
