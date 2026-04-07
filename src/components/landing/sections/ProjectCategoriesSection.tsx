'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Home, Hammer, Store, Paintbrush, TreePine, Factory,
  ArrowRight, Sparkles, Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { projectCategories } from '@/data';

const categoryConfig: Record<string, {
  icon: typeof Home;
  gradient: string;
  iconBg: string;
  iconColor: string;
  description: string;
  emoji: string;
  glowColor: string;
}> = {
  'Pembangunan Rumah': {
    icon: Home,
    gradient: 'from-primary/5 to-teal-500/5',
    iconBg: 'bg-gradient-to-br from-primary to-teal-600',
    iconColor: 'text-white',
    description: 'Bangun rumah impian dari nol dengan kontraktor berpengalaman',
    emoji: '🏗️',
    glowColor: 'hover:shadow-primary/20',
  },
  'Renovasi': {
    icon: Hammer,
    gradient: 'from-amber-500/5 to-orange-500/5',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    iconColor: 'text-white',
    description: 'Perbarui tampilan dan struktur bangunan sesuai kebutuhan',
    emoji: '🔨',
    glowColor: 'hover:shadow-amber-500/20',
  },
  'Komersial': {
    icon: Store,
    gradient: 'from-teal-500/5 to-emerald-500/5',
    iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
    iconColor: 'text-white',
    description: 'Pembangunan gedung perkantoran, ruko, dan fasilitas bisnis',
    emoji: '🏢',
    glowColor: 'hover:shadow-teal-500/20',
  },
  'Interior': {
    icon: Paintbrush,
    gradient: 'from-violet-500/5 to-purple-500/5',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconColor: 'text-white',
    description: 'Desain dan finishing interior ruangan dengan sentuhan elegan',
    emoji: '🎨',
    glowColor: 'hover:shadow-violet-500/20',
  },
  'Fasilitas': {
    icon: TreePine,
    gradient: 'from-emerald-500/5 to-green-500/5',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    iconColor: 'text-white',
    description: 'Pembangunan kolam renang, taman, dan area outdoor',
    emoji: '🌳',
    glowColor: 'hover:shadow-emerald-500/20',
  },
  'Industrial': {
    icon: Factory,
    gradient: 'from-slate-500/5 to-slate-700/5',
    iconBg: 'bg-gradient-to-br from-slate-600 to-slate-700',
    iconColor: 'text-white',
    description: 'Konstruksi pabrik, gudang, dan fasilitas industri berat',
    emoji: '🏭',
    glowColor: 'hover:shadow-slate-500/20',
  },
};

// Sparkle particles data
const sparklePositions = [
  { top: '10%', left: '15%' },
  { top: '20%', right: '20%' },
  { bottom: '25%', left: '10%' },
  { top: '15%', right: '10%' },
  { bottom: '15%', right: '15%' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

function CategoryCard({ category, index }: { category: { name: string; count: number; image: string }; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const config = categoryConfig[category.name] || {
    icon: Home,
    gradient: 'from-primary/5 to-teal-500/5',
    iconBg: 'bg-gradient-to-br from-primary to-teal-600',
    iconColor: 'text-white',
    description: 'Proyek konstruksi berkualitas tinggi',
    emoji: '🏗️',
    glowColor: 'hover:shadow-primary/20',
  };
  const IconComponent = config.icon;

  return (
    <motion.div
      variants={itemVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="perspective-[1000px]"
    >
      <motion.div
        whileHover={{
          rotateY: -5,
          rotateX: 5,
          scale: 1.03,
          transition: { duration: 0.3 },
        }}
        className="transform-style-preserve-3d"
      >
        <Card className={`group cursor-pointer overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200/80 transition-all duration-500 ${config.glowColor} relative`}>
          {/* Hover gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

          {/* Colored top border accent */}
          <div className={`h-1 w-full bg-gradient-to-r ${config.iconBg}`} />

          <div className="relative h-28 overflow-hidden">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Default gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

            {/* Emoji icon */}
            <div className="absolute top-2 right-2 text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
              {config.emoji}
            </div>

            {/* Icon */}
            <div className={`absolute bottom-2 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <IconComponent className="h-4.5 w-4.5 text-slate-700" />
            </div>

            {/* Hover gradient overlay with description */}
            <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <p className="text-white text-[11px] leading-tight">{config.description}</p>
            </div>

            {/* Sparkle effect on hover */}
            {isHovered && sparklePositions.map((pos, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="absolute pointer-events-none z-10"
                style={pos as React.CSSProperties}
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
              </motion.div>
            ))}
          </div>

          <CardContent className="p-3 text-center relative z-10">
            <h3 className="font-semibold text-sm mb-0.5 text-slate-800 group-hover:text-primary transition-colors">
              {category.name}
            </h3>
            <p className="text-xs text-slate-400">
              <span className="font-bold text-primary">{category.count}+</span> proyek
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function ProjectCategoriesSection() {
  return (
    <section id="categories" className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
            <Search className="h-4 w-4" />
            <span className="font-semibold text-sm">Jelajahi</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Kategori{' '}
            <span className="gradient-text">Proyek</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Temukan proyek sesuai kebutuhan Anda dari berbagai kategori konstruksi
          </p>
        </motion.div>

        {/* Category Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5"
        >
          {projectCategories.map((category, index) => (
            <CategoryCard key={category.name} category={category} index={index} />
          ))}
        </motion.div>

        {/* Lihat Semua Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 border-slate-200 text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 font-medium"
            >
              Lihat Semua Proyek
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
