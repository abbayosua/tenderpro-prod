'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Calendar,
  Eye,
  Heart,
  Plus,
  FolderOpen,
  Layers,
  Hammer,
  Paintbrush,
  Building2,
  Zap,
  LayoutList,
  Filter,
  ArrowUpDown,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah, getRelativeTime } from '@/lib/helpers';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  clientName?: string;
  location?: string;
  year: number;
  budget?: number;
  images: string[];
  createdAt: string;
  // Stats (if available)
  views?: number;
  likes?: number;
}

interface PortfolioGridProps {
  /** Contractor profile ID to fetch portfolios for */
  contractorId?: string;
  /** User ID (alternative to contractorId) */
  userId?: string;
  /** Show the "Tambah Portfolio" button */
  showAddButton?: boolean;
  /** Callback when "Tambah Portfolio" is clicked */
  onAddPortfolio?: () => void;
  /** Callback when a portfolio item is clicked */
  onPortfolioClick?: (portfolio: PortfolioItem) => void;
  /** Callback when like button is clicked */
  onLike?: (portfolioId: string) => void;
  /** Number of items per page */
  pageSize?: number;
  /** Whether to show the category summary counts */
  showStats?: boolean;
  /** Maximum height for the grid container */
  maxHeight?: string;
  /** Custom empty state message */
  emptyMessage?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Layers; gradient: string; emoji: string; color: string }> = {
  'Pembangunan Baru': { icon: Building2, gradient: 'from-emerald-400 to-teal-500', emoji: '🏗️', color: 'text-emerald-600' },
  'Renovasi': { icon: Hammer, gradient: 'from-amber-400 to-orange-500', emoji: '🔨', color: 'text-amber-600' },
  'Interior': { icon: Paintbrush, gradient: 'from-rose-400 to-pink-500', emoji: '🎨', color: 'text-rose-600' },
  'Konstruksi': { icon: Building2, gradient: 'from-slate-400 to-slate-600', emoji: '🏗️', color: 'text-slate-600' },
  'MEP': { icon: Zap, gradient: 'from-yellow-400 to-amber-500', emoji: '⚡', color: 'text-yellow-600' },
  'Landscape': { icon: Layers, gradient: 'from-green-400 to-emerald-500', emoji: '🌿', color: 'text-green-600' },
  'Umum': { icon: LayoutList, gradient: 'from-primary to-teal-600', emoji: '📋', color: 'text-primary' },
  'Lainnya': { icon: LayoutList, gradient: 'from-primary to-teal-600', emoji: '📋', color: 'text-primary' },
};

const DEFAULT_CATEGORY = { icon: Layers, gradient: 'from-primary to-teal-600', emoji: '📋', color: 'text-primary' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

// Valid image URL patterns
function isValidImageUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function PortfolioGrid({
  contractorId,
  userId,
  showAddButton = false,
  onAddPortfolio,
  onPortfolioClick,
  onLike,
  pageSize = 12,
  showStats = true,
  maxHeight,
  emptyMessage,
}: PortfolioGridProps) {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
  const [totalPortfolioCount, setTotalPortfolioCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolios
  useEffect(() => {
    async function fetchPortfolios() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('limit', String(pageSize));
        params.set('summary', 'true');
        if (contractorId) params.set('contractorId', contractorId);
        else if (userId) params.set('userId', userId);

        const res = await fetch(`/api/portfolios?${params.toString()}`);
        const data = await res.json();

        if (data.portfolios) {
          // Filter and validate image URLs
          const validPortfolios = data.portfolios.map((p: PortfolioItem) => ({
            ...p,
            images: Array.isArray(p.images)
              ? p.images.filter((img: string) => isValidImageUrl(img))
              : [],
          }));
          setPortfolios(validPortfolios);
        }

        if (data.categorySummary) {
          setCategorySummary(data.categorySummary);
        }

        if (data.totalPortfolios != null) {
          setTotalPortfolioCount(data.totalPortfolios);
        }

        if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error('Error fetching portfolios:', err);
        setError('Gagal memuat portofolio');
      } finally {
        setLoading(false);
      }
    }

    if (contractorId || userId) {
      fetchPortfolios();
    } else {
      setLoading(false);
    }
  }, [contractorId, userId, pageSize]);

  // Build category list from summary
  const categories = useMemo(() => {
    const cats = ['Semua'];
    Object.keys(categorySummary).forEach((cat) => {
      if (!cats.includes(cat)) cats.push(cat);
    });
    // Also add categories from loaded portfolios that might not be in summary
    portfolios.forEach((p) => {
      if (!cats.includes(p.category)) cats.push(p.category);
    });
    return cats;
  }, [categorySummary, portfolios]);

  // Filter portfolios by active category
  const filteredPortfolios = useMemo(() => {
    if (activeCategory === 'Semua') return portfolios;
    return portfolios.filter((p) => p.category === activeCategory);
  }, [portfolios, activeCategory]);

  // Stats
  const totalViews = useMemo(
    () => portfolios.reduce((sum, p) => sum + (p.views || 0), 0),
    [portfolios]
  );
  const totalLikes = useMemo(
    () => portfolios.reduce((sum, p) => sum + (p.likes || 0), 0),
    [portfolios]
  );

  const getCategoryConfig = useCallback(
    (category: string) => CATEGORY_CONFIG[category] || DEFAULT_CATEGORY,
    []
  );

  // Height classes for masonry effect
  const getCardHeight = (index: number) => {
    const heights = ['h-44', 'h-56', 'h-48', 'h-52', 'h-40', 'h-48', 'h-56', 'h-44'];
    return heights[index % heights.length];
  };

  const gridContainerClass = maxHeight ? `max-h-[${maxHeight}]` : '';

  return (
    <div className="w-full space-y-6">
      {/* Header with stats */}
      {showStats && (totalPortfolioCount > 0 || totalViews > 0 || totalLikes > 0) && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Layers className="h-4 w-4 text-primary" />
            <span className="font-semibold text-slate-700">{totalPortfolioCount}</span> portofolio
          </div>
          {totalViews > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Eye className="h-3.5 w-3.5" />
              <span>{totalViews.toLocaleString('id-ID')}</span> dilihat
            </div>
          )}
          {totalLikes > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Heart className="h-3.5 w-3.5" />
              <span>{totalLikes.toLocaleString('id-ID')}</span> suka
            </div>
          )}
        </div>
      )}

      {/* Category Filter Pills */}
      {!loading && portfolios.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = cat === 'Semua'
                ? totalPortfolioCount
                : categorySummary[cat] || 0;
              const catConfig = getCategoryConfig(cat);
              const Icon = catConfig.icon;

              return (
                <motion.button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat}</span>
                  {count > 0 && (
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className={`text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center ${
                        isActive
                          ? 'bg-white/20 text-white border-0'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {count}
                    </Badge>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={gridContainerClass}>
        {maxHeight ? (
          <ScrollArea className="max-h-[600px]">
            <PortfolioContent
              loading={loading}
              error={error}
              portfolios={filteredPortfolios}
              showAddButton={showAddButton}
              onAddPortfolio={onAddPortfolio}
              onPortfolioClick={onPortfolioClick}
              onLike={onLike}
              getCategoryConfig={getCategoryConfig}
              getCardHeight={getCardHeight}
              emptyMessage={emptyMessage}
            />
          </ScrollArea>
        ) : (
          <PortfolioContent
            loading={loading}
            error={error}
            portfolios={filteredPortfolios}
            showAddButton={showAddButton}
            onAddPortfolio={onAddPortfolio}
            onPortfolioClick={onPortfolioClick}
            onLike={onLike}
            getCategoryConfig={getCategoryConfig}
            getCardHeight={getCardHeight}
            emptyMessage={emptyMessage}
          />
        )}
      </div>
    </div>
  );
}

// Separate content component for scroll area support
function PortfolioContent({
  loading,
  error,
  portfolios,
  showAddButton,
  onAddPortfolio,
  onPortfolioClick,
  onLike,
  getCategoryConfig,
  getCardHeight,
  emptyMessage,
}: {
  loading: boolean;
  error: string | null;
  portfolios: PortfolioItem[];
  showAddButton: boolean;
  onAddPortfolio?: () => void;
  onPortfolioClick?: (portfolio: PortfolioItem) => void;
  onLike?: (portfolioId: string) => void;
  getCategoryConfig: (cat: string) => typeof DEFAULT_CATEGORY;
  getCardHeight: (index: number) => string;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="break-inside-avoid">
            <Skeleton className="h-48 w-full rounded-t-xl" />
            <div className="p-4 bg-slate-50 rounded-b-xl border border-t-0 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-200">
        <FolderOpen className="h-16 w-16 text-red-300 mx-auto mb-4" />
        <p className="text-red-500 mb-1 text-lg font-medium">Gagal memuat</p>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-10 w-10 text-slate-300" />
          </div>
        </motion.div>
        <p className="text-slate-500 mb-1 text-lg font-medium">
          {emptyMessage || 'Belum ada portofolio'}
        </p>
        <p className="text-sm text-slate-400 mb-6">
          Mulai tambahkan portofolio untuk menampilkan karya Anda
        </p>
        {showAddButton && onAddPortfolio && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onAddPortfolio}
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white rounded-xl px-6 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Portofolio
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Add button floating */}
      {showAddButton && onAddPortfolio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onAddPortfolio}
              size="sm"
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white rounded-xl shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Portofolio
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Masonry-style Grid - Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={portfolios.map((p) => p.id).join(',')}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
        >
          {portfolios.map((portfolio, index) => {
            const catConfig = getCategoryConfig(portfolio.category);
            const Icon = catConfig.icon;
            const hasImage = portfolio.images.length > 0;
            const coverImage = hasImage ? portfolio.images[0] : null;

            return (
              <motion.div
                key={portfolio.id}
                variants={cardVariants}
                layout
                whileHover={{ scale: 1.02, transition: { duration: 0.25 } }}
                className="break-inside-avoid group"
              >
                <Card
                  className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
                  onClick={() => onPortfolioClick?.(portfolio)}
                >
                  {/* Image area */}
                  <div
                    className={`${getCardHeight(index)} ${hasImage ? '' : catConfig.gradient} relative overflow-hidden`}
                  >
                    {hasImage && coverImage ? (
                      <img
                        src={coverImage}
                        alt={portfolio.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-full h-full ${catConfig.gradient} flex items-center justify-center`}>
                        <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                          {catConfig.emoji}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center">
                      {/* Action buttons on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white text-slate-800 hover:bg-white/90 shadow-lg text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPortfolioClick?.(portfolio);
                          }}
                        >
                          <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                          Detail
                        </Button>
                        {onLike && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-slate-800 hover:bg-white/90 shadow-lg text-xs font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLike(portfolio.id);
                            }}
                          >
                            <Heart className="h-3.5 w-3.5 mr-1.5" />
                            Suka
                          </Button>
                        )}
                      </div>

                      {/* Bottom info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed">
                          {portfolio.description}
                        </p>
                      </div>
                    </div>

                    {/* Category badge - always visible */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm text-[11px] shadow-sm border-0 font-medium">
                        {catConfig.emoji} {portfolio.category}
                      </Badge>
                    </div>

                    {/* Year badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur-sm text-[11px] shadow-sm border-0">
                        <Calendar className="h-3 w-3 mr-1" />
                        {portfolio.year}
                      </Badge>
                    </div>

                    {/* Stats on card (bottom right) */}
                    {((portfolio.views && portfolio.views > 0) || (portfolio.likes && portfolio.likes > 0)) && (
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-80">
                        {portfolio.views && portfolio.views > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                            <Eye className="h-2.5 w-2.5" />
                            {portfolio.views}
                          </span>
                        )}
                        {portfolio.likes && portfolio.likes > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                            <Heart className="h-2.5 w-2.5" />
                            {portfolio.likes}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {portfolio.title}
                    </h3>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      {portfolio.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{portfolio.location}</span>
                        </span>
                      )}
                      {portfolio.clientName && (
                        <span className="line-clamp-1">• {portfolio.clientName}</span>
                      )}
                    </div>

                    {/* Footer: budget + time */}
                    <div className="flex items-center justify-between">
                      {portfolio.budget ? (
                        <span className="text-sm font-bold text-primary">
                          {formatRupiah(portfolio.budget)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {getRelativeTime(portfolio.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
