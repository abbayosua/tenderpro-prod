'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Building2, CheckCircle, TrendingUp, Star, HardHat, Wrench, Ruler } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

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
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.6 + i * 0.1, ease: 'easeOut' },
  }),
} as any;

const wordVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, delay: 0.35 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} as any;

const floatingIcons = [
  { Icon: HardHat, className: 'top-16 left-[8%] text-primary/10', delay: 0 },
  { Icon: Wrench, className: 'top-32 right-[10%] text-teal-500/10', delay: 2 },
  { Icon: Ruler, className: 'bottom-20 left-[15%] text-primary/8', delay: 4 },
  { Icon: Building2, className: 'top-48 left-[5%] text-emerald-500/8', delay: 1 },
  { Icon: CheckCircle, className: 'bottom-32 right-[12%] text-primary/10', delay: 3 },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

/* Animated counter hook */
function useAnimatedCounter(target: string, inView: boolean, duration = 1800) {
  const [display, setDisplay] = useState('0');
  const frameRef = useRef<number>(0);
  const numericValueRef = useRef(0);
  const suffixRef = useRef('');
  const isDecimalRef = useRef(false);

  // Store parsed values in refs (no setState in effect)
  useEffect(() => {
    const numericMatch = target.match(/([\d.]+)/);
    suffixRef.current = target.replace(/[\d.]+/, '');
    numericValueRef.current = numericMatch ? parseFloat(numericMatch[1]) : 0;
    isDecimalRef.current = numericMatch?.[1]?.includes('.') ?? false;

    if (!inView) return;

    if (numericValueRef.current === 0) {
      // Schedule setState outside of effect body using microtask
      queueMicrotask(() => setDisplay(target));
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numericValueRef.current * eased;

      if (isDecimalRef.current) {
        setDisplay(current.toFixed(1) + suffixRef.current);
      } else {
        setDisplay(Math.floor(current).toLocaleString('id-ID') + suffixRef.current);
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        if (isDecimalRef.current) {
          setDisplay(numericValueRef.current.toFixed(1) + suffixRef.current);
        } else {
          setDisplay(Math.floor(numericValueRef.current).toLocaleString('id-ID') + suffixRef.current);
        }
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, [inView, target, duration]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Reset to 0 when not in view
  useEffect(() => {
    if (!inView) {
      queueMicrotask(() => setDisplay('0'));
    }
  }, [inView]);

  return display;
}

export function HeroSection({ onRegister }: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-50px' });

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    // Responsive particle count based on screen width
    const count = width < 640 ? 20 : width < 1024 ? 35 : 55;
    const colors = [
      'rgba(14, 116, 144, ',   // primary/teal
      'rgba(20, 184, 166, ',   // teal-500
      'rgba(16, 185, 129, ',   // emerald-500
      'rgba(14, 116, 144, ',   // primary (more weight)
      'rgba(20, 184, 166, ',   // teal-500 (more weight)
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1), // float upward
        radius: Math.random() * 1.5 + 1, // 1-2.5px
        opacity: Math.random() * 0.2 + 0.1, // 0.1-0.3
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.offsetWidth * dpr;
      canvas.height = parent.offsetHeight * dpr;
      canvas.style.width = `${parent.offsetWidth}px`;
      canvas.style.height = `${parent.offsetHeight}px`;
      ctx.scale(dpr, dpr);
      initParticles(canvas);
    };

    const frameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.x += Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.05;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(frameLoop);
    };

    resizeCanvas();
    animFrameRef.current = requestAnimationFrame(frameLoop);

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [initParticles]);

  const headlineWords = ['Hubungkan', 'Kontraktor', '&', 'Pemilik', 'Proyek', 'Terpercaya'];

  const stats = [
    { icon: CheckCircle, value: '500+', label: 'Proyek Selesai', gradient: 'from-primary/10 to-primary/5', iconColor: 'text-primary' },
    { icon: TrendingUp, value: 'Rp 50Miliar+', label: 'Nilai Proyek', gradient: 'from-teal-500/10 to-teal-500/5', iconColor: 'text-teal-500' },
    { icon: Building2, value: '150+', label: 'Kontraktor Aktif', gradient: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-500' },
    { icon: Star, value: '4.8', label: 'Rating Rata-rata', gradient: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-500' },
  ];

  return (
    <section className="relative w-full overflow-hidden pb-10 pt-20 md:pb-16 md:pt-24">
      {/* Slow-moving animated gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, rgba(14,116,144,0.04) 0%, rgba(20,184,166,0.06) 25%, rgba(16,185,129,0.04) 50%, rgba(14,116,144,0.06) 75%, rgba(20,184,166,0.04) 100%)',
          backgroundSize: '400% 400%',
          animation: 'heroGradientShift 12s ease-in-out infinite',
        }}
      />

      {/* Background decorations */}
      <div className="absolute inset-0 grid-pattern opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />

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

          {/* Title with word-by-word reveal */}
          <motion.h1
            variants={itemVariants}
            className="mx-auto mb-6 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl lg:text-6xl"
          >
            {headlineWords.map((word, i) => {
              const isGradient = i >= 3; // "Pemilik Proyek Terpercaya" gets gradient
              return (
                <motion.span
                  key={i}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className={isGradient ? 'gradient-text' : ''}
                >
                  {word}{' '}
                </motion.span>
              );
            })}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl"
          >
            Platform tender konstruksi terpercaya di Indonesia. Temukan kontraktor berkualitas atau dapatkan proyek impian Anda dengan mudah dan aman.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
              <Button
                size="lg"
                className="group w-full rounded-full bg-primary px-8 py-6 text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/40 hover:bg-primary/90 sm:w-auto relative overflow-hidden"
                onClick={() => onRegister('OWNER')}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
              <Button
                size="lg"
                variant="outline"
                className="group w-full rounded-full border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-8 py-6 text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:border-primary/40 sm:w-auto relative overflow-hidden"
                onClick={() => onRegister('CONTRACTOR')}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8 w-full">
            {stats.map((stat, i) => (
              <StatCard
                key={stat.label}
                stat={stat}
                index={i}
                inView={statsInView}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Inline keyframes for animated gradient */}
      <style jsx global>{`
        @keyframes heroGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
}

function StatCard({
  stat,
  index,
  inView,
}: {
  stat: { icon: typeof CheckCircle; value: string; label: string; gradient: string; iconColor: string };
  index: number;
  inView: boolean;
}) {
  const counter = useAnimatedCounter(stat.value, inView);

  return (
    <motion.div
      custom={index}
      variants={statsVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
      className={`group flex flex-col items-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br ${stat.gradient} p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 dark:hover:border-primary/20 backdrop-blur-sm relative overflow-hidden`}
    >
      {/* Subtle shine on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
        <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
      </div>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{counter}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
    </motion.div>
  );
}
