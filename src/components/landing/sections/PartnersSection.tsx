'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, CheckCircle, FileCheck, Handshake, Briefcase, Users, Building2, TrendingUp, ExternalLink, HardHat, Truck, ClipboardCheck } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { partners } from '@/data';

type PartnerCategory = 'Semua' | 'General Contractor' | 'Material Supplier' | 'Consulting';

const partnerCategories: { label: PartnerCategory; icon: React.ElementType }[] = [
  { label: 'Semua', icon: Briefcase },
  { label: 'General Contractor', icon: HardHat },
  { label: 'Material Supplier', icon: Truck },
  { label: 'Consulting', icon: ClipboardCheck },
];

const badges = [
  { icon: Shield, text: 'ISO 9001:2015', gradient: 'from-primary/10 to-teal-500/10', iconBg: 'bg-primary/10' },
  { icon: CheckCircle, text: 'Terdaftar di Kemenparekraf', gradient: 'from-emerald-500/10 to-green-500/10', iconBg: 'bg-emerald-500/10' },
  { icon: FileCheck, text: 'Verifikasi Dokumen Ketat', gradient: 'from-amber-500/10 to-yellow-500/10', iconBg: 'bg-amber-500/10' },
  { icon: Handshake, text: 'Garansi Transaksi Aman', gradient: 'from-primary/10 to-teal-500/10', iconBg: 'bg-primary/10' },
];

const trustMetrics = [
  { icon: Briefcase, value: 500, suffix: '+', label: 'Proyek', color: 'text-primary' },
  { icon: Users, value: 200, suffix: '+', label: 'Kontraktor', color: 'text-teal-600' },
  { icon: Building2, value: 50, suffix: '+', label: 'Klien Korporat', color: 'text-emerald-600' },
  { icon: TrendingUp, value: 98, suffix: '%', label: 'Tingkat Kepuasan', color: 'text-amber-600' },
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

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = target;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export function PartnersSection() {
  const [activeCategory, setActiveCategory] = useState<PartnerCategory>('Semua');
  const [hoveredPartner, setHoveredPartner] = useState<number | null>(null);

  // Duplicate partners for infinite marquee
  const marqueePartners = [...partners, ...partners];

  return (
    <section className="relative z-10 py-20 overflow-hidden">
      {/* Background with gradient and dot pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
      <div className="absolute inset-0 dot-pattern opacity-30" />
      {/* Decorative gradient accents */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" />

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
            <Building2 className="h-4 w-4" />
            <span className="font-semibold text-sm">Jaringan Partner</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
            Dipercaya oleh{' '}
            <span className="gradient-text">
              <AnimatedCounter target={500} suffix="+" /> Perusahaan
            </span>
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
            Bergabung dengan jaringan kontraktor dan penyedia material terpercaya di Indonesia
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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden flex flex-col items-center p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50/80 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              <div className={`relative z-10 h-12 w-12 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm transition-all duration-300`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <span className="relative z-10 text-2xl md:text-3xl font-bold text-slate-800">
                <AnimatedCounter target={metric.value} suffix={metric.suffix} />
              </span>
              <span className="relative z-10 text-xs text-slate-500 font-medium mt-1">{metric.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {partnerCategories.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.label;
            return (
              <motion.button
                key={cat.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-md shadow-primary/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary'
                }`}
              >
                <CatIcon className="h-4 w-4" />
                {cat.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Infinite Marquee Partner Logos */}
        <div className="relative overflow-hidden mb-12">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px z-10">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>

          <div className="marquee-track py-4">
            {marqueePartners.map((partner, index) => (
              <motion.div
                key={`${partner.name}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredPartner(index)}
                onMouseLeave={() => setHoveredPartner(null)}
                className="relative mx-4 flex items-center justify-center h-16 md:h-20 px-6 md:px-8 rounded-2xl grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:shadow-xl border border-transparent hover:border-primary/20 hover:bg-white/80 backdrop-blur-sm cursor-pointer group"
              >
                {/* Shimmer overlay on hover */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                </div>
                <img src={partner.logo} alt={partner.name} className="h-full w-auto object-contain max-w-[120px] md:max-w-[160px] relative z-10" />
                {/* Hover tooltip */}
                {hoveredPartner === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg z-20 flex items-center gap-1"
                  >
                    {partner.name}
                    <ExternalLink className="h-3 w-3" />
                    {/* Tooltip arrow */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Bottom shimmer line */}
          <div className="absolute bottom-0 left-0 right-0 h-px z-10">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
        </div>

        {/* Separator line with gradient */}
        <div className="my-10 relative">
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
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r ${badge.gradient} backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge.iconBg} shadow-sm`}>
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
