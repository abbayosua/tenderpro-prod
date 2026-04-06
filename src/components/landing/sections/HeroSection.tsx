'use client';

import { Button } from '@/components/ui/button';
import { User, Building2, CheckCircle, TrendingUp, Star, HardHat, Wrench, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onRegister: (role: 'OWNER' | 'CONTRACTOR') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.6 + i * 0.1, ease: 'easeOut' },
  }),
};

const floatingIcons = [
  { Icon: HardHat, className: 'top-16 left-[8%] text-primary/10', delay: 0 },
  { Icon: Wrench, className: 'top-32 right-[10%] text-teal-500/10', delay: 2 },
  { Icon: Ruler, className: 'bottom-20 left-[15%] text-primary/8', delay: 4 },
  { Icon: Building2, className: 'top-48 left-[5%] text-emerald-500/8', delay: 1 },
  { Icon: CheckCircle, className: 'bottom-32 right-[12%] text-primary/10', delay: 3 },
];

export function HeroSection({ onRegister }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden pb-10 pt-20 md:pb-16 md:pt-24">
      {/* Background decorations */}
      <div className="absolute inset-0 grid-pattern opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Floating construction icons */}
      {floatingIcons.map(({ Icon, className, delay }, idx) => (
        <motion.div
          key={idx}
          className={`absolute hidden lg:block ${className}`}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
        >
          <Icon className="h-12 w-12" />
        </motion.div>
      ))}

      <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center md:max-w-4xl md:px-6 lg:max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              PLATFORM TENDER KONSTRUKSI TERPERCAYA
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="mx-auto mb-6 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl"
          >
            Hubungkan Kontraktor &{' '}
            <span className="gradient-text">Pemilik Proyek</span>{' '}
            Terpercaya
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl"
          >
            Platform tender konstruksi terpercaya di Indonesia. Temukan kontraktor berkualitas atau dapatkan proyek impian Anda dengan mudah dan aman.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="w-full rounded-full bg-primary px-8 py-6 text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-100 sm:w-auto"
              onClick={() => onRegister('OWNER')}
            >
              <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-slate-300 bg-white/80 backdrop-blur-sm px-8 py-6 text-slate-700 shadow-sm transition-all duration-300 hover:bg-white hover:text-slate-900 hover:shadow-md hover:scale-105 active:scale-100 sm:w-auto"
              onClick={() => onRegister('CONTRACTOR')}
            >
              <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8 w-full">
            {[
              { icon: CheckCircle, value: '500+', label: 'Proyek Selesai', gradient: 'from-primary/10 to-primary/5' },
              { icon: TrendingUp, value: 'Rp 50Miliar+', label: 'Nilai Proyek', gradient: 'from-teal-500/10 to-teal-500/5' },
              { icon: Building2, value: '150+', label: 'Kontraktor Aktif', gradient: 'from-emerald-500/10 to-emerald-500/5' },
              { icon: Star, value: '4.8', label: 'Rating Rata-rata', gradient: 'from-amber-500/10 to-amber-500/5' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={statsVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group flex flex-col items-center rounded-2xl border border-slate-100 bg-gradient-to-br ${stat.gradient} p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-200 backdrop-blur-sm`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
