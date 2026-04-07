'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, Sparkles, FileCheck, Award, Shield, PartyPopper, Send, Users, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
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

const featureBadges = [
  { icon: FileCheck, label: 'Proyek Mingguan', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100', iconBg: 'bg-teal-100' },
  { icon: Sparkles, label: 'Tips Ahli', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100' },
  { icon: Award, label: 'Penawaran Eksklusif', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100' },
];

const subscriberAvatars = [
  { initials: 'AR', bg: 'from-primary to-teal-500' },
  { initials: 'BK', bg: 'from-amber-400 to-orange-500' },
  { initials: 'CT', bg: 'from-violet-400 to-purple-500' },
  { initials: 'DW', bg: 'from-emerald-400 to-green-500' },
];

const subscriberNames = ['Ahmad R.', 'Budi K.', 'Citra T.', 'Dewi W.'];

// Confetti particles for success state
const confettiParticles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 200 - 100,
  y: -(Math.random() * 150 + 50),
  rotate: Math.random() * 360,
  scale: Math.random() * 0.5 + 0.5,
  color: ['#10b981', '#14b8a6', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
  delay: Math.random() * 0.3,
}));

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
      {count.toLocaleString('id-ID')}{suffix}
    </span>
  );
}

function SuccessState({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="text-center py-6"
    >
      <div className="relative inline-block mb-4">
        {/* Confetti particles */}
        {confettiParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: 0,
              x: p.x,
              y: p.y,
              rotate: p.rotate,
              transition: { delay: p.delay, duration: 1.5, ease: 'easeOut' },
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-sm pointer-events-none"
            style={{ backgroundColor: p.color }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="h-8 w-8 text-white" />
          </motion.div>
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-bold text-white mb-2"
      >
        Berhasil Berlangganan! 🎉
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-slate-400 text-sm"
      >
        Cek inbox Anda untuk konfirmasi.
      </motion.p>
    </motion.div>
  );
}

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch subscriber count on mount
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/newsletter');
        const data = await res.json();
        if (data.success && data.data?.displayCount != null) {
          setSubscriberCount(data.data.displayCount);
        }
      } catch {
        // Silently fall back to default count
        setSubscriberCount(10000);
      }
    }
    fetchCount();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Gagal berlangganan',
          description: data.error || 'Terjadi kesalahan. Silakan coba lagi.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);

      toast({
        title: 'Berhasil berlangganan!',
        description: data.data?.message || 'Terima kasih! Anda telah berlangganan newsletter TenderPro.',
      });

      setEmail('');

      // Refresh subscriber count
      try {
        const countRes = await fetch('/api/newsletter');
        const countData = await countRes.json();
        if (countData.success && countData.data?.displayCount != null) {
          setSubscriberCount(countData.data.displayCount);
        }
      } catch {
        // Silently ignore
      }
    } catch {
      setIsLoading(false);
      toast({
        title: 'Gagal berlangganan',
        description: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  }, [email, isLoading, toast]);

  const resetSuccess = useCallback(() => setIsSuccess(false), []);

  // Use subscriberCount from API, fallback to 10000
  const displayCount = subscriberCount ?? 10000;

  return (
    <section id="newsletter" className="relative z-10 py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-teal-50/50 to-white" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      {/* Decorative gradient blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Floating mail icon (decorative) */}
      <motion.div
        className="absolute top-12 left-[10%] opacity-5 hidden md:block"
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Mail className="h-24 w-24 text-primary" />
      </motion.div>
      <motion.div
        className="absolute bottom-12 right-[10%] opacity-5 hidden md:block"
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Send className="h-20 w-20 text-teal-500" />
      </motion.div>

      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="text-center"
        >
          {/* Animated Envelope Icon */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-xl shadow-primary/25">
                <Mail className="h-8 w-8 text-white" />
              </div>
              {/* Ping animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-teal-500"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold text-slate-800 mb-3"
          >
            Tetap Update dengan{' '}
            <span className="gradient-text">TenderPro</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-slate-500 mb-8 max-w-lg mx-auto"
          >
            Dapatkan info proyek terbaru, tips konstruksi, dan penawaran eksklusif
          </motion.p>

          {/* Social proof counter with avatar stack */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="flex -space-x-3">
              {subscriberAvatars.map((avatar, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200 }}
                  className="relative group"
                >
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatar.bg} border-[2.5px] border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white`}>
                    {avatar.initials}
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {subscriberNames[i]}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                  </div>
                </motion.div>
              ))}
              {/* +N indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-[2.5px] border-white shadow-md flex items-center justify-center"
              >
                <span className="text-[9px] font-bold text-slate-500">
                  +{(displayCount - 4).toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 0 })}
                </span>
              </motion.div>
            </div>
            <div className="text-left">
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-800">
                  <AnimatedCounter target={displayCount} suffix="+" />
                </span>{' '}
                profesional
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3 w-3 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-[10px] text-slate-400 ml-1">dari pelanggan kami</span>
              </div>
            </div>
          </motion.div>

          {/* Email Form or Success State */}
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="form"
                variants={itemVariants}
                onSubmit={handleSubmit}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8"
              >
                <div className="relative flex-1">
                  {/* Gradient border effect on focus */}
                  <div className={`absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary via-teal-500 to-emerald-400 opacity-0 transition-opacity duration-300 ${isFocused ? 'opacity-100' : ''}`} />
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Input
                      type="email"
                      placeholder="Masukkan email Anda..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      required
                      disabled={isLoading}
                      className="pl-10 h-12 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/20 rounded-xl shadow-sm disabled:opacity-60"
                    />
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="h-12 px-8 bg-gradient-to-r from-primary via-teal-600 to-emerald-600 hover:from-primary/90 hover:via-teal-600/90 hover:to-emerald-600/90 text-white rounded-xl shadow-lg shadow-primary/25 font-semibold relative overflow-hidden group disabled:opacity-60"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5">
                          <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
                        </div>
                        <span className="text-sm">Mengirim...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                        Berlangganan
                        <Zap className="h-3 w-3 ml-1.5 opacity-70" />
                      </>
                    )}
                    {/* Animated shimmer overlay */}
                    {!isLoading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div key="success" className="mb-8">
                <SuccessState onClose={resetSuccess} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature Badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {featureBadges.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -3, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border shadow-sm cursor-default transition-colors ${badge.bg}`}
              >
                <div className={`w-6 h-6 rounded-lg ${badge.iconBg} flex items-center justify-center`}>{
                  <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
                }</div>
                <span className="text-sm text-slate-700 font-medium">{badge.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust indicators row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-6 mt-6"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="h-4 w-4 text-emerald-500" />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium">Gratis selamanya</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-xs text-slate-500 font-medium">Email mingguan</span>
            </div>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-slate-500 font-medium">
                {displayCount.toLocaleString('id-ID')}+ anggota
              </span>
            </div>
          </motion.div>

          {/* Privacy note with shield */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 mt-5"
          >
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200/60">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
              </motion.div>
              <span className="text-xs text-slate-500">Kami menjaga privasi Anda. Berhenti kapan saja.</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
