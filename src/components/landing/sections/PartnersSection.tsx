'use client';

import { Shield, CheckCircle, FileCheck, Handshake, Briefcase, Users, Building2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { partners } from '@/data';

const badges = [
  { icon: Shield, text: 'ISO 9001:2015', gradient: 'from-primary/10 to-teal-500/10' },
  { icon: CheckCircle, text: 'Terdaftar di Kemenparekraf', gradient: 'from-emerald-500/10 to-green-500/10' },
  { icon: FileCheck, text: 'Verifikasi Dokumen Ketat', gradient: 'from-amber-500/10 to-yellow-500/10' },
  { icon: Handshake, text: 'Garansi Transaksi Aman', gradient: 'from-violet-500/10 to-purple-500/10' },
];

const trustMetrics = [
  { icon: Briefcase, value: '500+', label: 'Proyek', color: 'text-primary' },
  { icon: Users, value: '200+', label: 'Kontraktor', color: 'text-teal-600' },
  { icon: Building2, value: '50+', label: 'Klien Korporat', color: 'text-emerald-600' },
  { icon: TrendingUp, value: '98%', label: 'Tingkat Kepuasan', color: 'text-amber-600' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export function PartnersSection() {
  return (
    <section className="relative z-10 py-16 bg-white border-y overflow-hidden">
      {/* Decorative dot pattern background */}
      <div className="absolute inset-0 dot-pattern opacity-40" />
      {/* Decorative gradient accents */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Partner Terpercaya</h2>
          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
            Dipercaya oleh organisasi terkemuka di Indonesia
          </p>
        </motion.div>

        {/* Trust Metrics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {trustMetrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <metric.icon className={`h-6 w-6 ${metric.color} mb-2`} />
              <span className="text-2xl font-bold text-slate-800">{metric.value}</span>
              <span className="text-xs text-slate-500 font-medium">{metric.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Partner Logos */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="relative flex items-center justify-center h-12 md:h-14 px-4 rounded-xl grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 hover:shadow-lg hover:border-primary/30 border border-transparent hover:bg-white"
            >
              <img src={partner.logo} alt={partner.name} className="h-full w-auto object-contain max-w-[120px] md:max-w-[150px]" />
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-teal-500/5 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>

        {/* Separator line with gradient */}
        <div className="my-8 relative">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary/30" />
        </div>

        {/* Badges - Glassmorphism Style */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${badge.gradient} backdrop-blur-sm border border-white/60 shadow-sm`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                <badge.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-slate-700">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
