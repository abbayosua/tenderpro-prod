'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Avatar, AvatarFallback } from '@/components/ui';
import { Star, MessageSquare, Filter, ArrowUpDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelativeTime } from '@/lib/helpers';

interface Review {
  id: string;
  rating: number;
  review: string | null;
  professionalism: number;
  quality: number;
  timeliness: number;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    avatar?: string;
    company?: string | null;
  };
  project: {
    id: string;
    title: string;
    category: string;
  };
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  categoryAverages: {
    professionalism: number;
    quality: number;
    timeliness: number;
  };
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
}

interface ReviewListProps {
  contractorId: string;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-700">{value}/5</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 5) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
        />
      </div>
    </div>
  );
}

export function ReviewList({ contractorId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number, append: boolean = false) => {
    const isLoadMore = append;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '5',
        sortBy,
        filterRating,
      });
      const res = await fetch(`/api/contractors/${contractorId}/reviews?${params}`);
      const data = await res.json();

      if (data.success) {
        setReviews(prev => isLoadMore ? [...prev, ...data.reviews] : data.reviews);
        setSummary(data.summary);
        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [contractorId, sortBy, filterRating]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleFilterChange = (value: string) => {
    setFilterRating(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-slate-500">Memuat ulasan...</span>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="font-medium text-slate-600 mb-1">Belum Ada Ulasan</p>
          <p className="text-sm text-slate-400">
            Kontraktor ini belum memiliki ulasan dari pemilik proyek.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Rating */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-slate-800">{summary.averageRating}</p>
                <StarRating rating={Math.round(summary.averageRating)} size="md" />
                <p className="text-sm text-slate-500 mt-1">{summary.totalReviews} ulasan</p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-1.5">
                {summary.ratingDistribution.map((item) => (
                  <div key={item.rating} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-6 text-right">{item.rating}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.5, delay: (5 - item.rating) * 0.1 }}
                        className="h-full rounded-full bg-amber-400"
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{item.count}</span>
                  </div>
                ))}
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori Rata-rata</p>
                <CategoryBar label="Profesionalisme" value={summary.categoryAverages.professionalism} />
                <CategoryBar label="Kualitas" value={summary.categoryAverages.quality} />
                <CategoryBar label="Ketepatan Waktu" value={summary.categoryAverages.timeliness} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={filterRating} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Semua Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Rating</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>{r} Bintang</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="highest">Rating Tertinggi</SelectItem>
              <SelectItem value="lowest">Rating Terendah</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Badge variant="secondary" className="self-center">
          {reviews.length} ulasan ditampilkan
        </Badge>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {review.fromUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium text-sm">{review.fromUser.name}</p>
                          <p className="text-xs text-slate-400">
                            {review.fromUser.company || review.project.category}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">{getRelativeTime(review.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <StarRating rating={review.rating} />
                        <span className="text-sm font-semibold text-slate-700">{review.rating}.0</span>
                      </div>

                      {/* Category Mini Bars */}
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Profesional</p>
                          <p className="text-sm font-medium text-slate-700">{review.professionalism}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Kualitas</p>
                          <p className="text-sm font-medium text-slate-700">{review.quality}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Tepat Waktu</p>
                          <p className="text-sm font-medium text-slate-700">{review.timeliness}</p>
                        </div>
                      </div>

                      {review.review && (
                        <p className="text-sm text-slate-600 mt-3 leading-relaxed">{review.review}</p>
                      )}

                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <span>Proyek:</span>
                        <span className="font-medium text-slate-500">{review.project.title}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchReviews(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memuat...</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-2" /> Muat Lebih Banyak</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
