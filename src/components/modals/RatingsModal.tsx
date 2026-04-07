'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  Award,
  MessageSquare,
  Clock,
  User,
  ThumbsUp,
  Loader2,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelativeTime } from '@/lib/helpers';

interface RatingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface ReviewerInfo {
  id: string;
  name: string;
  avatar?: string | null;
  isVerified: boolean;
  company?: string | null;
}

interface ProjectInfo {
  id: string;
  title: string;
  category: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  review?: string | null;
  professionalism: number;
  quality: number;
  timeliness: number;
  createdAt: string;
  fromUser: ReviewerInfo;
  project: ProjectInfo;
}

interface RatingsData {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<number, number>;
  categoryAverages: {
    professionalism: number;
    quality: number;
    timeliness: number;
  };
  reviews: ReviewItem[];
}

const emptyRatings: RatingsData = {
  averageRating: 0,
  totalReviews: 0,
  breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  categoryAverages: { professionalism: 0, quality: 0, timeliness: 0 },
  reviews: [],
};

function StarRating({
  rating,
  size = 'sm',
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onChange?: (val: number) => void;
}) {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const halfFilled = !filled && star === Math.ceil(rating) && rating % 1 >= 0.3;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-150`}
          >
            <Star
              className={`${sizeMap[size]} ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : halfFilled
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-slate-200 text-slate-200'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function getRatingLabel(rating: number): string {
  if (rating >= 4.8) return 'Luar Biasa';
  if (rating >= 4.3) return 'Sangat Baik';
  if (rating >= 3.8) return 'Baik';
  if (rating >= 3.0) return 'Cukup';
  if (rating >= 2.0) return 'Kurang';
  return 'Perlu Perbaikan';
}

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-emerald-600';
  if (rating >= 3.5) return 'text-green-600';
  if (rating >= 2.5) return 'text-amber-600';
  return 'text-red-500';
}

function getRatingBgColor(rating: number): string {
  if (rating >= 4.5) return 'bg-emerald-50 border-emerald-200';
  if (rating >= 3.5) return 'bg-green-50 border-green-200';
  if (rating >= 2.5) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export function RatingsModal({ open, onOpenChange, userId }: RatingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RatingsData>(emptyRatings);

  const fetchRatings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ratings?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) {
      fetchRatings();
    }
  }, [open, fetchRatings]);

  const hasReviews = data.totalReviews > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        {/* Dark Gradient Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-6 py-5 flex-shrink-0 relative overflow-hidden">
          {/* Decorative elements */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg"
            >
              <Award className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-white">
                Rating & Ulasan
              </DialogTitle>
              <DialogDescription className="text-white/60 mt-0.5">
                Penilaian dari pemilik proyek
              </DialogDescription>
            </div>
            {hasReviews && (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-white">{data.averageRating}</span>
                <span className="text-xs text-white/50">({data.totalReviews})</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-slate-500">Memuat rating & ulasan...</p>
          </div>
        ) : !hasReviews ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Star className="h-8 w-8 text-slate-300" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-700">
                Belum Ada Rating
              </p>
              <p className="text-xs text-slate-400 max-w-[260px]">
                Selesaikan proyek untuk mendapatkan rating dan ulasan dari pemilik proyek
              </p>
            </div>
            <div className="flex items-center gap-4 pt-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>Ulasan</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                <span>Pencapaian</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="px-6 pb-6 pt-5 space-y-5">
              {/* Overall Rating Display */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-slate-200 overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-6">
                      {/* Large Rating Number */}
                      <div className="text-center flex-shrink-0">
                        <motion.p
                          key={data.averageRating}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className={`text-4xl font-extrabold ${getRatingColor(data.averageRating)}`}
                        >
                          {data.averageRating}
                        </motion.p>
                        <div className="mt-1">
                          <StarRating rating={data.averageRating} size="sm" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          {data.totalReviews} ulasan
                        </p>
                      </div>

                      {/* Rating Label + Breakdown Bars */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRatingBgColor(data.averageRating)} border ${getRatingColor(data.averageRating)} text-xs font-semibold`}>
                            {getRatingLabel(data.averageRating)}
                          </Badge>
                        </div>

                        {/* Star Distribution */}
                        <div className="space-y-1.5">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = data.breakdown[star] || 0;
                            const pct = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 w-3 text-right font-medium">{star}</span>
                                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: (5 - star) * 0.08 }}
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 w-5 text-right font-medium">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Category Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Rincian Kategori
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Profesionalisme',
                      value: data.categoryAverages.professionalism,
                      icon: <User className="h-3.5 w-3.5" />,
                      color: 'from-blue-500 to-blue-600',
                      bgColor: 'bg-blue-50',
                      borderColor: 'border-blue-200',
                      textColor: 'text-blue-700',
                    },
                    {
                      label: 'Kualitas',
                      value: data.categoryAverages.quality,
                      icon: <ThumbsUp className="h-3.5 w-3.5" />,
                      color: 'from-emerald-500 to-emerald-600',
                      bgColor: 'bg-emerald-50',
                      borderColor: 'border-emerald-200',
                      textColor: 'text-emerald-700',
                    },
                    {
                      label: 'Ketepatan Waktu',
                      value: data.categoryAverages.timeliness,
                      icon: <Clock className="h-3.5 w-3.5" />,
                      color: 'from-amber-500 to-amber-600',
                      bgColor: 'bg-amber-50',
                      borderColor: 'border-amber-200',
                      textColor: 'text-amber-700',
                    },
                  ].map((cat, idx) => (
                    <motion.div
                      key={cat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + idx * 0.08 }}
                      whileHover={{ y: -2 }}
                      className={`p-3.5 rounded-xl border ${cat.borderColor} ${cat.bgColor} transition-all duration-300 hover:shadow-sm`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color} text-white`}>
                          {cat.icon}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 flex-1 truncate">
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${cat.textColor}`}>
                          {cat.value}
                        </span>
                        <StarRating rating={cat.value} size="xs" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <Separator className="bg-slate-100" />

              {/* Individual Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Ulasan
                    </h3>
                    <Badge variant="outline" className="text-[10px] ml-1">
                      {data.reviews.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>Terbaru</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {data.reviews.map((review, idx) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + idx * 0.06 }}
                        whileHover={{ y: -1 }}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-300"
                      >
                        {/* Reviewer Info + Rating */}
                        <div className="flex items-start gap-3 mb-3">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                            {review.fromUser.avatar ? (
                              <img
                                src={review.fromUser.avatar}
                                alt={review.fromUser.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-500">
                                {review.fromUser.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Name + Company */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-slate-800 truncate">
                                {review.fromUser.name}
                              </span>
                              {review.fromUser.isVerified && (
                                <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              )}
                            </div>
                            {review.fromUser.company && (
                              <p className="text-[11px] text-slate-400 truncate">
                                {review.fromUser.company}
                              </p>
                            )}
                          </div>

                          {/* Rating Badge */}
                          <Badge className={`${getRatingBgColor(review.rating)} border flex items-center gap-1 flex-shrink-0`}>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className={`text-xs font-bold ${getRatingColor(review.rating)}`}>
                              {review.rating}
                            </span>
                          </Badge>
                        </div>

                        {/* Project Info */}
                        <div className="flex items-center gap-2 mb-2.5 text-[11px] text-slate-500">
                          <div className="p-1 rounded bg-slate-100">
                            <CheckCircle className="h-2.5 w-2.5 text-slate-400" />
                          </div>
                          <span className="font-medium truncate">{review.project.title}</span>
                          <span className="text-slate-300 flex-shrink-0">•</span>
                          <span className="text-slate-400 flex-shrink-0">{review.project.category}</span>
                        </div>

                        {/* Review Text */}
                        {review.review && (
                          <p className="text-sm text-slate-600 leading-relaxed mb-3">
                            &ldquo;{review.review}&rdquo;
                          </p>
                        )}

                        {/* Category Ratings for This Review */}
                        <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <User className="h-2.5 w-2.5" />
                            <StarRating rating={review.professionalism} size="xs" />
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <ThumbsUp className="h-2.5 w-2.5" />
                            <StarRating rating={review.quality} size="xs" />
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Clock className="h-2.5 w-2.5" />
                            <StarRating rating={review.timeliness} size="xs" />
                          </div>
                          <div className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {getRelativeTime(review.createdAt)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-2"
              >
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200"
                >
                  Tutup
                </Button>
              </motion.div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
