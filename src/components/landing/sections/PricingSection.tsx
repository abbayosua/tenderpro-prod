'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, X, Sparkles, Phone, Zap, Building2, Crown, Shield, Clock, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice?: string;
  priceNote?: string;
  description: string;
  features: { text: string; included: boolean }[];
  button: { label: string; variant: 'outline' | 'gradient' | 'default'; onClick?: () => void };
  popular?: boolean;
  bestValue?: boolean;
  icon: React.ElementType;
  badge?: string;
  tierTheme: 'slate' | 'primary' | 'premium';
  guarantee?: string;
}

const plans: PricingPlan[] = [
  {
    name: 'Gratis',
    price: 'Rp 0',
    priceNote: '/bulan',
    description: 'Untuk pemilik proyek yang baru memulai',
    icon: Zap,
    tierTheme: 'slate',
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
    yearlyPrice: 'Rp 399.000',
    priceNote: '/bulan',
    description: 'Untuk pengguna profesional yang aktif',
    icon: Crown,
    tierTheme: 'primary',
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
    guarantee: 'Garansi 30 Hari',
  },
  {
    name: 'Enterprise',
    price: 'Hubungi Kami',
    description: 'Untuk perusahaan besar dengan kebutuhan khusus',
    icon: Building2,
    tierTheme: 'premium',
    bestValue: true,
    badge: 'Best Value',
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

const pricingFAQs = [
  {
    q: 'Apakah saya bisa berhenti berlangganan kapan saja?',
    a: 'Ya, Anda bisa berhenti berlangganan kapan saja tanpa biaya penalti. Akses premium akan aktif hingga akhir periode berlangganan Anda.',
  },
  {
    q: 'Bagaimana cara pembayaran?',
    a: 'Kami menerima pembayaran melalui transfer bank (BCA, Mandiri, BNI, BRI), virtual account, dan e-wallet (GoPay, OVO, DANA). Semua transaksi dijamin aman.',
  },
  {
    q: 'Apakah ada diskon untuk kontraktor lokal?',
    a: 'Ya! Kontraktor dengan sertifikasi lokal mendapatkan diskon 15% untuk paket Profesional. Hubungi tim kami untuk detail lebih lanjut.',
  },
  {
    q: 'Berapa lama masa percobaan gratis?',
    a: 'Anda mendapatkan 14 hari percobaan gratis untuk paket Profesional. Tidak perlu kartu kredit. Jika tidak puas, Anda tidak akan dikenakan biaya.',
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

const featureVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.05 },
  }),
};

function AnimatedPrice({ target, prefix = '' }: { target: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!isInView) return;
    const numericStr = target.replace(/[^0-9]/g, '');
    const targetNum = parseInt(numericStr, 10) || 0;
    if (targetNum === 0) {
      setDisplay(target);
      return;
    }

    const duration = 1500;
    const steps = 40;
    const increment = targetNum / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        const formatted = Math.floor(current).toLocaleString('id-ID');
        setDisplay(prefix + formatted);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, target, prefix]);

  return <span ref={ref}>{display}</span>;
}

function PricingCard({ plan, isYearly, index }: { plan: PricingPlan; isYearly: boolean; index: number }) {
  const Icon = plan.icon;
  const isPopular = plan.popular;
  const isBestValue = plan.bestValue;

  const tierStyles = {
    slate: {
      bg: 'bg-gradient-to-br from-slate-50 via-white to-slate-50',
      borderColor: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      glowShadow: 'hover:shadow-slate-200/50',
    },
    primary: {
      bg: 'bg-gradient-to-br from-primary/[0.03] via-white to-teal-50/50',
      borderColor: 'border-primary/30 hover:border-primary/50',
      iconBg: 'bg-gradient-to-br from-primary to-teal-600',
      iconColor: 'text-white',
      glowShadow: 'hover:shadow-primary/20',
    },
    premium: {
      bg: 'bg-gradient-to-br from-amber-50/50 via-white to-primary/[0.02]',
      borderColor: 'border-amber-200/50 hover:border-amber-300/50',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      iconColor: 'text-white',
      glowShadow: 'hover:shadow-amber-200/50',
    },
  };

  const style = tierStyles[plan.tierTheme];

  const displayPrice = () => {
    if (plan.price === 'Hubungi Kami') return plan.price;
    if (isYearly && plan.yearlyPrice) return plan.yearlyPrice;
    return plan.price;
  };

  return (
    <motion.div
      variants={itemVariants}
      className={`md:col-span-1 ${
        isPopular ? 'md:-mt-4 md:mb-0 order-first md:order-none' : ''
      }`}
    >
      <motion.div
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="h-full"
      >
        <Card
          className={`relative overflow-hidden h-full transition-all duration-500 border-2 ${style.borderColor} ${style.bg} ${isPopular ? 'shadow-xl shadow-primary/10 md:scale-[1.02]' : `hover:shadow-xl ${style.glowShadow}`} rounded-2xl`}
        >
          {/* Top gradient line */}
          <div className={`h-1 w-full ${
            isPopular
              ? 'bg-gradient-to-r from-primary via-teal-400 to-primary'
              : isBestValue
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200'
          }`} />

          {/* Decorative glassmorphism glow */}
          {isPopular && (
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          )}
          {isBestValue && (
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-amber-300/10 rounded-full blur-3xl pointer-events-none" />
          )}

          {/* Animated badge */}
          {(plan.badge) && (
            <div className="absolute top-4 right-4 z-10">
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <span className={`relative inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-lg ${
                  isPopular
                    ? 'bg-gradient-to-r from-primary to-teal-600 shadow-primary/30'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/30'
                }`}>
                  <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-inherit" />
                  <Sparkles className="h-3 w-3" />
                  {plan.badge}
                </span>
              </motion.div>
            </div>
          )}

          {/* Guarantee badge for Pro */}
          {plan.guarantee && (
            <div className="absolute top-4 left-4 z-10">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700"
              >
                <Shield className="h-3 w-3" />
                {plan.guarantee}
              </motion.div>
            </div>
          )}

          <CardHeader className={`p-6 pb-4 ${isPopular || isBestValue ? 'pt-12' : 'pt-6'}`}>
            <motion.div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md ${style.iconBg}`}
              whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
            >
              <Icon className={`h-7 w-7 ${style.iconColor}`} />
            </motion.div>
            <CardTitle className="text-xl font-bold text-slate-800">
              {plan.name}
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 mt-1">
              {plan.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {/* Animated Price */}
            <div className="mb-6">
              {plan.price === 'Hubungi Kami' ? (
                <span className="text-3xl md:text-4xl font-bold text-slate-800">
                  {plan.price}
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl md:text-4xl font-bold ${isPopular ? 'gradient-text' : 'text-slate-800'}`}>
                    <AnimatedPrice target={displayPrice()} prefix="Rp " />
                  </span>
                  <span className="text-sm text-slate-500">{plan.priceNote}</span>
                </div>
              )}
              {isYearly && plan.price !== 'Hubungi Kami' && plan.yearlyPrice && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Rp {(parseInt(plan.yearlyPrice.replace(/[^0-9]/g, ''), 10) * 12).toLocaleString('id-ID')}/tahun (hemat Rp {((parseInt(plan.price.replace(/[^0-9]/g, ''), 10) - parseInt(plan.yearlyPrice.replace(/[^0-9]/g, ''), 10)) * 12).toLocaleString('id-ID')})
                </motion.p>
              )}
            </div>

            {/* Features with staggered animation */}
            <ul className="space-y-3">
              {plan.features.map((feature, i) => (
                <motion.li
                  key={feature.text}
                  custom={i}
                  variants={featureVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  {feature.included ? (
                    <motion.div
                      className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5"
                      whileHover={{ scale: 1.2 }}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </motion.div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="h-3 w-3 text-slate-400" />
                    </div>
                  )}
                  <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                    {feature.text}
                  </span>
                </motion.li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            {plan.button.variant === 'gradient' ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                <Button
                  className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  onClick={() => toast.success('Pendaftaran berhasil! Coba gratis 14 hari.')}
                >
                  {plan.button.label}
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                <Button
                  variant="outline"
                  className={`w-full h-12 text-sm font-semibold transition-all duration-300 ${
                    isBestValue
                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                      : 'border-slate-200 hover:bg-primary hover:text-white hover:border-primary'
                  }`}
                  onClick={plan.button.onClick}
                >
                  {plan.button.label}
                  {plan.name === 'Gratis' && (
                    <span className="ml-2 text-xs">→</span>
                  )}
                  {plan.name === 'Enterprise' && (
                    <Phone className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </motion.div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="relative z-10 py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
      <div className="absolute inset-0 dot-pattern opacity-30" />
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold text-sm">Harga Transparan</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Pilihan Paket untuk{' '}
            <span className="gradient-text">Setiap Kebutuhan</span>
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            Mulai gratis, upgrade kapan saja. Tanpa biaya tersembunyi.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isYearly
                  ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-md shadow-primary/20'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                isYearly
                  ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-md shadow-primary/20'
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
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} isYearly={isYearly} index={index} />
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          className="text-center text-sm text-slate-400 mt-10 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Clock className="h-3.5 w-3.5" />
          Semua harga dalam Rupiah (IDR). Pajak mungkin berlaku. Bisa berhenti berlangganan kapan saja.
        </motion.p>

        {/* Comparison Table */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-primary mb-3">
              <HelpCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Perbandingan Lengkap</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Bandingkan Semua Paket</h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-white">
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 border-b border-slate-100">Fitur</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-700 border-b border-slate-100 w-28">Gratis</th>
                  <th className="text-center px-4 py-4 w-36 border-b border-primary/20 relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-t-2xl" />
                    <span className="relative font-bold text-primary">Profesional</span>
                    <div className="flex justify-center mt-1 relative">
                      <Badge className="bg-primary/10 text-primary text-[10px] h-5 px-2">Populer</Badge>
                    </div>
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-700 border-b border-slate-100 w-28">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { feature: 'Proyek per bulan', free: '3', pro: 'Tak Terbatas', enterprise: 'Tak Terbatas' },
                  { feature: 'Lihat profil kontraktor', free: true, pro: true, enterprise: true },
                  { feature: 'Chat dasar', free: true, pro: true, enterprise: true },
                  { feature: 'Notifikasi email', free: true, pro: true, enterprise: true },
                  { feature: 'AI Bid Assistant', free: false, pro: true, enterprise: true },
                  { feature: 'AI Cost Estimator', free: false, pro: true, enterprise: true },
                  { feature: 'Dashboard analitik', free: false, pro: true, enterprise: true },
                  { feature: 'Prioritas tampilan', free: false, pro: true, enterprise: true },
                  { feature: 'Dukungan prioritas', free: false, pro: 'Email & Chat', enterprise: 'Dedicated 24/7' },
                  { feature: 'API akses', free: false, pro: false, enterprise: true },
                  { feature: 'Multi-user management', free: false, pro: false, enterprise: true },
                  { feature: 'Custom branding', free: false, pro: false, enterprise: true },
                  { feature: 'SLA', free: false, pro: false, enterprise: '99.9%' },
                  { feature: 'Account manager', free: false, pro: false, enterprise: true },
                ].map((row, idx) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-600 font-medium">{row.feature}</td>
                    <td className="text-center px-4 py-3.5">
                      {typeof row.free === 'boolean' ? (
                        row.free
                          ? <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          : <X className="h-4 w-4 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-slate-600">{row.free}</span>
                      )}
                    </td>
                    <td className="text-center px-4 py-3.5 bg-primary/[0.02]">
                      {typeof row.pro === 'boolean' ? (
                        row.pro
                          ? <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          : <X className="h-4 w-4 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-slate-600 font-medium">{row.pro}</span>
                      )}
                    </td>
                    <td className="text-center px-4 py-3.5">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise
                          ? <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          : <X className="h-4 w-4 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-slate-600 font-medium">{row.enterprise}</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          className="mt-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-primary mb-3">
              <HelpCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Pertanyaan Umum</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">FAQ Harga</h3>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {pricingFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem value={`pricing-faq-${index}`} className="border border-slate-200 rounded-xl px-5 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow data-[state=open]:shadow-md data-[state=open]:border-primary/30">
                  <AccordionTrigger className="text-sm font-medium text-slate-700 hover:text-primary hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
