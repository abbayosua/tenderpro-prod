'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Phone, Zap, Building2, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface PricingPlan {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: { text: string; included: boolean }[];
  button: { label: string; variant: 'outline' | 'gradient' | 'default'; onClick?: () => void };
  popular?: boolean;
  icon: React.ElementType;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    name: 'Gratis',
    price: 'Rp 0',
    priceNote: '/bulan',
    description: 'Untuk pemilik proyek yang baru memulai',
    icon: Zap,
    features: [
      { text: 'Buat 3 proyek/bulan', included: true },
      { text: 'Lihat profil kontraktor', included: true },
      { text: 'Chat dasar', included: true },
      { text: 'Notifikasi email', included: true },
      { text: 'Proyek tak terbatas', included: false },
      { text: 'AI Bid Assistant', included: false },
      { text: 'Dashboard analitik', included: false },
    ],
    button: { label: 'Mulai Gratis', variant: 'outline' },
  },
  {
    name: 'Profesional',
    price: 'Rp 499.000',
    priceNote: '/bulan',
    description: 'Untuk pengguna profesional yang aktif',
    icon: Crown,
    features: [
      { text: 'Semua fitur Gratis', included: true },
      { text: 'Proyek tak terbatas', included: true },
      { text: 'AI Bid Assistant', included: true },
      { text: 'AI Cost Estimator', included: true },
      { text: 'Dashboard analitik', included: true },
      { text: 'Prioritas tampilan', included: true },
      { text: 'Dukungan prioritas', included: true },
    ],
    button: {
      label: 'Coba 14 Hari Gratis',
      variant: 'gradient',
    },
    popular: true,
    badge: 'Paling Populer',
  },
  {
    name: 'Enterprise',
    price: 'Hubungi Kami',
    description: 'Untuk perusahaan besar dengan kebutuhan khusus',
    icon: Building2,
    features: [
      { text: 'Semua fitur Profesional', included: true },
      { text: 'API akses', included: true },
      { text: 'Multi-user management', included: true },
      { text: 'Custom branding', included: true },
      { text: 'SLA 99.9%', included: true },
      { text: 'Account manager khusus', included: true },
      { text: 'Onboarding dedicated', included: true },
    ],
    button: {
      label: 'Hubungi Sales',
      variant: 'outline',
      onClick: () => toast.success('Tim sales kami akan menghubungi Anda'),
    },
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="relative z-10 py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold text-sm">Harga Transparan</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Pilihan Paket untuk Setiap Kebutuhan
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            Mulai gratis, upgrade kapan saja. Tanpa biaya tersembunyi.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isYearly
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                isYearly
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tahunan
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-2 py-0.5 h-5">
                Hemat 20%
              </Badge>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {/* Reorder on mobile: Profesional first */}
          {[plans[1], plans[0], plans[2]].map((plan, displayIndex) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            // Map display index back to actual position for stagger
            const actualIndex = plans.indexOf(plan);

            return (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                className={`md:col-span-1 ${
                  isPopular ? 'md:-mt-4 md:mb-0 order-first md:order-none' : ''
                }`}
              >
                <Card
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isPopular
                      ? 'border-2 border-primary shadow-lg shadow-primary/10 md:scale-105 rounded-2xl'
                      : 'border border-slate-200 rounded-2xl'
                  }`}
                >
                  {/* Popular badge */}
                  {plan.badge && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-primary to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  {/* Gradient top border for popular */}
                  {isPopular && (
                    <div className="h-1 bg-gradient-to-r from-primary via-teal-500 to-primary" />
                  )}

                  <CardHeader className={`p-6 ${isPopular ? 'pb-4' : 'pb-4'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      isPopular
                        ? 'bg-gradient-to-br from-primary to-teal-600'
                        : 'bg-slate-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${isPopular ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 mt-1">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className={`px-6 ${isPopular ? 'pt-0 pb-6' : 'pt-0 pb-6'}`}>
                    {/* Price */}
                    <div className="mb-6">
                      {plan.price.startsWith('Rp') ? (
                        <div className="flex items-baseline gap-1">
                          {isYearly ? (
                            <>
                              <span className="text-3xl md:text-4xl font-bold text-slate-800">
                                Rp 399.000
                              </span>
                              <span className="text-sm text-slate-500">/bulan</span>
                            </>
                          ) : (
                            <>
                              <span className="text-3xl md:text-4xl font-bold text-slate-800">
                                {plan.price}
                              </span>
                              <span className="text-sm text-slate-500">{plan.priceNote}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-3xl md:text-4xl font-bold text-slate-800">
                          {plan.price}
                        </span>
                      )}
                      {isYearly && plan.price.startsWith('Rp') && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          Rp 4.788.000 per tahun (hemat Rp 1.192.000)
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-3">
                          {feature.included ? (
                            <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-green-600" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                              <X className="h-3 w-3 text-slate-400" />
                            </div>
                          )}
                          <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    {plan.button.variant === 'gradient' ? (
                      <Button
                        className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                        onClick={() => toast.success('Pendaftaran berhasil! Coba gratis 14 hari.')}
                      >
                        {plan.button.label}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className={`w-full h-12 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] ${
                          isPopular ? 'border-slate-200' : 'border-slate-200'
                        }`}
                        onClick={plan.button.onClick}
                      >
                        {plan.button.label}
                        {!isPopular && plan.name === 'Gratis' && (
                          <span className="ml-2 text-xs opacity-60">→</span>
                        )}
                        {plan.name === 'Enterprise' && (
                          <Phone className="h-4 w-4 ml-2" />
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          className="text-center text-sm text-slate-400 mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Semua harga dalam Rupiah (IDR). Pajak mungkin berlaku. Bisa berhenti berlangganan kapan saja.
        </motion.p>
      </div>
    </section>
  );
}
