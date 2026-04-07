'use client';

import { Button } from '@/components/ui/button';
import { User, Building2, CheckCircle, Shield, Clock, HeadphonesIcon } from 'lucide-react';
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

export function CTASection({ onRegister }: CTASectionProps) {
  return (
    <section id="cta" className="relative z-10 py-24 overflow-hidden">
      {/* Background with multi-layer gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-teal-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-400/10 via-transparent to-transparent" />
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-white/90 text-sm font-medium">Platform #1 Konstruksi Indonesia</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold mb-5 text-white leading-tight">
            Siap Memulai Proyek<br className="hidden sm:block" /> Impian Anda?
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Bergabung dengan ribuan pemilik proyek dan kontraktor yang telah mempercayai TenderPro untuk mewujudkan proyek konstruksi mereka.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto h-13 px-8 text-base font-semibold shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
              onClick={() => onRegister('OWNER')}
            >
              <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/60 w-full sm:w-auto h-13 px-8 text-base font-semibold backdrop-blur-sm transition-all duration-200"
              onClick={() => onRegister('CONTRACTOR')}
            >
              <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors duration-200"
              >
                <badge.icon className="h-5 w-5 text-white/90" />
                <span className="text-white text-sm font-semibold">{badge.label}</span>
                <span className="text-white/60 text-xs">{badge.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
