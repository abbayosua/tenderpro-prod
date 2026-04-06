'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Home, Hammer, Store, Paintbrush, TreePine, Factory,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { projectCategories } from '@/data';

const categoryIcons: Record<string, { icon: typeof Home; accent: string; description: string }> = {
  'Pembangunan Rumah': {
    icon: Home,
    accent: 'bg-primary',
    description: 'Bangun rumah impian dari nol dengan kontraktor berpengalaman',
  },
  'Renovasi': {
    icon: Hammer,
    accent: 'bg-amber-500',
    description: 'Perbarui tampilan dan struktur bangunan sesuai kebutuhan',
  },
  'Komersial': {
    icon: Store,
    accent: 'bg-teal-500',
    description: 'Pembangunan gedung perkantoran, ruko, dan fasilitas bisnis',
  },
  'Interior': {
    icon: Paintbrush,
    accent: 'bg-violet-500',
    description: 'Desain dan finishing interior ruangan dengan sentuhan elegan',
  },
  'Fasilitas': {
    icon: TreePine,
    accent: 'bg-emerald-500',
    description: 'Pembangunan kolam renang, taman, dan area outdoor',
  },
  'Industrial': {
    icon: Factory,
    accent: 'bg-slate-600',
    description: 'Konstruksi pabrik, gudang, dan fasilitas industri berat',
  },
};

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function ProjectCategoriesSection() {
  return (
    <section id="categories" className="relative py-16 bg-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Kategori Proyek</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Temukan proyek sesuai kebutuhan Anda
          </p>
        </motion.div>

        {/* Category Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {projectCategories.map((category, index) => {
            const mapping = categoryIcons[category.name] || { icon: Home, accent: 'bg-primary', description: 'Proyek konstruksi berkualitas tinggi' };
            const IconComponent = mapping.icon;

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                <Card className="group cursor-pointer overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-slate-200">
                  {/* Colored top border accent */}
                  <div className={`h-1 w-full ${mapping.accent}`} />
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Default gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                    {/* Icon */}
                    <div className="absolute bottom-2 left-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm shadow-sm">
                      <IconComponent className="h-4 w-4 text-slate-700" />
                    </div>
                    {/* Hover gradient overlay from bottom with description */}
                    <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <p className="text-white text-[11px] leading-tight">{mapping.description}</p>
                    </div>
                  </div>
                  <CardContent className="p-3 text-center">
                    <h3 className="font-semibold text-sm mb-0.5 text-slate-800">{category.name}</h3>
                    <p className="text-xs text-slate-400">{category.count}+ proyek</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Lihat Semua Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Button
            variant="outline"
            className="rounded-full px-6 border-slate-200 text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 hover:shadow-md hover:shadow-primary/20"
          >
            Lihat Semua Kategori
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
