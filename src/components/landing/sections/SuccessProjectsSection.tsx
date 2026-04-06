'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Star, ArrowRight, Quote, Briefcase } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { successProjects } from '@/data';
import { formatRupiah } from '@/lib/helpers';

const testimonials: string[] = [
  'Hasil pembangunan sangat memuaskan, kontraktor sangat profesional dan menepati waktu.',
  'Renovasi berjalan lancar tanpa hambatan. Komunikasi sangat baik sepanjang proyek.',
  'Kualitas bangunan excellent, sesuai dengan spesifikasi yang disepakati. Sangat direkomendasikan!',
  'Proyek selesai lebih cepat dari jadwal dengan hasil yang melebihi ekspektasi kami.',
  'Tim kontraktor sangat berpengalaman dan memberikan solusi kreatif untuk setiap tantangan.',
  'Pengerjaan rapi dan detail. Kami sangat puas dengan hasil akhir proyek ini.',
];

const ratings = [4.9, 4.8, 5.0, 4.7, 4.9, 4.8];

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
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
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
      {count}
      {suffix}
    </span>
  );
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
      <span className={`ml-1 font-semibold ${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-700`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function SuccessBar({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="text-primary font-bold">100%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full"
          initial={{ width: 0 }}
          animate={isInView ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export function SuccessProjectsSection() {
  return (
    <section id="success-projects" className="relative z-10 py-16 bg-slate-50 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Proyek Sukses</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Bukti kepercayaan dari klien kami
          </p>
        </motion.div>

        {/* Animated counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-primary/20 shadow-sm">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-sm text-slate-600">Proyek Selesai:</span>
            <span className="text-xl font-bold text-primary">
              <AnimatedCounter target={500} suffix="+" />
            </span>
          </div>
        </motion.div>

        {/* Project Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {successProjects.map((project, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
            >
              <Card className="overflow-hidden h-full border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                {/* Image with gradient overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Bottom gradient overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <Badge className="absolute top-3 left-3 bg-primary text-white text-xs">{project.category}</Badge>
                  <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 text-slate-700 backdrop-blur-sm text-xs">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" /> Selesai
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-slate-800">{project.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-slate-500">
                    <MapPin className="h-3 w-3" /> {project.location}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Star Rating */}
                  <StarRating rating={ratings[index] || 4.8} />

                  {/* Success Progress Bar */}
                  <SuccessBar label="Tingkat Keberhasilan" />

                  {/* Project Details */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nilai Proyek</span>
                      <span className="font-bold text-primary">{formatRupiah(project.budget)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Durasi</span>
                      <span className="font-medium text-slate-700">{project.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Kontraktor</span>
                      <span className="font-medium text-slate-700 text-right text-xs max-w-[160px] truncate">{project.contractor}</span>
                    </div>
                  </div>

                  {/* Client Testimonial */}
                  <div className="relative rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <Quote className="absolute top-2 right-3 h-5 w-5 text-primary/15" />
                    <p className="text-xs text-slate-600 italic leading-relaxed pr-6">
                      &ldquo;{testimonials[index] || 'Proyek diselesaikan dengan sangat baik.'}&rdquo;
                    </p>
                  </div>

                  {/* Lihat Detail Button */}
                  <Button
                    variant="outline"
                    className="w-full rounded-lg border-slate-200 text-sm text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                  >
                    Lihat Detail
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
