'use client';

import { Button } from '@/components/ui/button';
import { User, Building2, CheckCircle, Shield, Clock, HeadphonesIcon, Quote, Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CTASectionProps {
  onRegister: (role: 'OWNER' | 'CONTRACTOR') => void;
}

const trustBadges = [
  { icon: Shield, label: 'Transaksi Aman', desc: 'Sistem escrow terpercaya' },
  { icon: CheckCircle, label: 'Kontraktor Terverifikasi', desc: 'Dokumen legal dicek' },
  { icon: Clock, label: 'Proses Cepat', desc: 'Mulai proyek dalam hitungan hari' },
  { icon: HeadphonesIcon, label: 'Dukungan 24/7', desc: 'Tim siap membantu Anda' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

export function CTASection({ onRegister }: CTASectionProps) {
  return (
    <section id="cta" className="relative z-10 py-28 overflow-hidden">
      {/* Background with multi-layer gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-teal-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-400/10 via-transparent to-transparent" />

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Animated floating orbs */}
      <motion.div
        className="absolute top-10 left-[10%] w-32 h-32 rounded-full bg-white/5 blur-2xl"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-10 right-[15%] w-40 h-40 rounded-full bg-teal-300/10 blur-2xl"
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-col items-center"
        >
          {/* Glassmorphism card wrapper */}
          <motion.div
            variants={itemVariants}
            className="w-full max-w-4xl rounded-3xl p-8 md:p-12 lg:p-14 relative overflow-hidden"
            style={{
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.10) 100%)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Inner glow effect */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}
            />

            {/* Badge */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-white/90 text-sm font-medium">Platform #1 Konstruksi Indonesia</span>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-5xl font-bold mb-5 text-white leading-tight"
            >
              Siap Memulai Proyek
              <br className="hidden sm:block" /> Impian Anda?
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Bergabung dengan ribuan pemilik proyek dan kontraktor yang telah mempercayai TenderPro untuk mewujudkan proyek konstruksi mereka.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <Button
                  size="lg"
                  className="group bg-white text-primary hover:bg-white/90 w-full sm:w-auto h-13 px-8 text-base font-semibold shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-200 relative overflow-hidden"
                  onClick={() => onRegister('OWNER')}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600" />
                  <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
                  <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="group border-2 border-white/30 text-white hover:bg-white/15 hover:border-white/50 w-full sm:w-auto h-13 px-8 text-base font-semibold backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-white/5 relative overflow-hidden"
                  onClick={() => onRegister('CONTRACTOR')}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600" />
                  <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
                  <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Testimonial Quote */}
            <motion.div
              variants={itemVariants}
              className="mb-0"
            >
              <div
                className="relative rounded-2xl p-6 max-w-2xl mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Quote className="absolute -top-3 left-6 h-6 w-6 text-white/20" />
                <p className="text-white/80 text-sm md:text-base italic leading-relaxed mb-4">
                  &ldquo;TenderPro sangat membantu kami menemukan kontraktor yang tepat. Prosesnya transparan, dan kami berhasil menyelesaikan proyek tepat waktu dengan kualitas yang sangat baik.&rdquo;
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white text-xs font-bold">
                    BR
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">Budi Raharjo</p>
                    <div className="flex items-center gap-1">
                      <p className="text-white/50 text-xs">Pemilik Proyek</p>
                      <span className="text-white/30">•</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-white/50 text-xs">5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Trust Badges - outside the glass card */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8 w-full"
          >
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-transform duration-300">
                  <badge.icon className="h-4 w-4 text-white/90" />
                </div>
                <span className="text-white text-sm font-semibold">{badge.label}</span>
                <span className="text-white/50 text-xs">{badge.desc}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
