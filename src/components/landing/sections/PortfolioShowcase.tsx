'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Briefcase, ArrowRight, FolderOpen, Layers, Hammer, Paintbrush, Building2, Zap, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah } from '@/lib/helpers';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  year: number;
  budget?: number;
  images: string[];
  createdAt: string;
}

const CATEGORY_CONFIG: Record<string, { icon: string; gradient: string; emoji: string }> = {
  'Pembangunan Baru': { icon: 'Building2', gradient: 'from-emerald-400 to-teal-500', emoji: '🏗️' },
  'Renovasi': { icon: 'Hammer', gradient: 'from-amber-400 to-orange-500', emoji: '🔨' },
  'Interior': { icon: 'Paintbrush', gradient: 'from-rose-400 to-pink-500', emoji: '🎨' },
  'Konstruksi': { icon: 'Building2', gradient: 'from-slate-400 to-slate-600', emoji: '🏗️' },
  'MEP': { icon: 'Zap', gradient: 'from-yellow-400 to-amber-500', emoji: '⚡' },
  'Umum': { icon: 'LayoutList', gradient: 'from-primary to-teal-600', emoji: '📋' },
};

const DEFAULT_CATEGORY = { icon: 'Layers', gradient: 'from-primary to-teal-600', emoji: '📋' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

export function PortfolioShowcase() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    async function fetchPortfolios() {
      try {
        const res = await fetch('/api/portfolios?limit=6');
        const data = await res.json();
        if (data.portfolios) {
          setPortfolios(data.portfolios.slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolios();
  }, []);

  const categories = useMemo(() => {
    const cats = ['Semua', ...new Set(portfolios.map(p => p.category))];
    return cats;
  }, [portfolios]);

  const filteredPortfolios = useMemo(() => {
    if (activeCategory === 'Semua') return portfolios;
    return portfolios.filter(p => p.category === activeCategory);
  }, [portfolios, activeCategory]);

  const getGradient = (category: string) => {
    return CATEGORY_CONFIG[category]?.gradient || DEFAULT_CATEGORY.gradient;
  };

  const getEmoji = (category: string) => {
    return CATEGORY_CONFIG[category]?.emoji || DEFAULT_CATEGORY.emoji;
  };

  return (
    <section id="portfolio" className="relative z-10 py-20 bg-white overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
            <Layers className="h-4 w-4" />
            <span className="font-semibold text-sm">Galeri Karya</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Portofolio Kontraktor{' '}
            <span className="gradient-text">Terbaik</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Lihat hasil karya kontraktor terbaik di platform TenderPro
          </p>
        </motion.div>

        {/* Category Filter Tabs with Animated Underline */}
        {!loading && portfolios.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-1 mb-10"
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const catConfig = CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full ${
                    isActive
                      ? 'text-primary'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {cat}
                  {/* Animated underline */}
                  <motion.div
                    className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-primary to-teal-500 rounded-full"
                    initial={false}
                    animate={{
                      scaleX: isActive ? 1 : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ transformOrigin: 'center' }}
                  />
                  {/* Active background pill */}
                  <motion.div
                    className="absolute inset-0 bg-primary/10 rounded-full"
                    initial={false}
                    animate={{
                      scale: isActive ? 1 : 0.8,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="break-inside-avoid">
                <Skeleton className="h-48 w-full rounded-t-xl" />
                <div className="p-4 bg-slate-50 rounded-b-xl border border-t-0">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-1 text-lg">Belum ada portofolio</p>
            <p className="text-sm text-slate-400">Portofolio kontraktor akan segera ditampilkan di sini</p>
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeCategory}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="columns-2 md:columns-3 gap-4 space-y-4"
              >
                {filteredPortfolios.map((portfolio, index) => {
                  const heights = ['h-40', 'h-48', 'h-56', 'h-44', 'h-52', 'h-40'];
                  return (
                    <motion.div
                      key={portfolio.id}
                      variants={cardVariants}
                      layout
                      whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                      className="break-inside-avoid group"
                    >
                      <Card className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                        {/* Image placeholder area with gradient */}
                        <div
                          className={`${heights[index % heights.length]} ${getGradient(portfolio.category)} relative overflow-hidden flex items-center justify-center`}
                        >
                          {/* Category icon */}
                          <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                            {getEmoji(portfolio.category)}
                          </span>

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white text-slate-800 hover:bg-white/90 shadow-lg font-medium"
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </Button>
                            </div>
                            {/* Hover info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <p className="text-white text-xs font-medium line-clamp-1">{portfolio.description}</p>
                            </div>
                          </div>

                          {/* Category badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm text-xs shadow-sm border-0">
                              {getEmoji(portfolio.category)} {portfolio.category}
                            </Badge>
                          </div>

                          {/* Year badge */}
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-white/90 text-slate-600 backdrop-blur-sm text-xs shadow-sm border-0">
                              <Calendar className="h-3 w-3 mr-1" />
                              {portfolio.year}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold text-slate-800 text-sm mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                            {portfolio.title}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            {portfolio.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {portfolio.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            {portfolio.budget ? (
                              <span className="text-sm font-bold text-primary">
                                {formatRupiah(portfolio.budget)}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">Budget belum ditentukan</span>
                            )}
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {portfolio.category}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* View All Button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center mt-10"
            >
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 rounded-xl px-6"
              >
                Lihat Semua Portofolio
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
