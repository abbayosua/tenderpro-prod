'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { testimonials } from '@/data';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 transition-colors duration-200 ${
            i < rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-slate-700">{rating}.0</span>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative z-10 py-20 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="max-w-7xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block mb-3 text-xs font-semibold tracking-wider text-primary uppercase">Testimoni</span>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 md:text-4xl">Apa Kata Mereka?</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Pengalaman nyata dari pengguna TenderPro di seluruh Indonesia</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-30px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <Card className="h-full bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
                <CardContent className="p-6 relative">
                  {/* Quote decoration */}
                  <div className="absolute top-4 right-4">
                    <Quote className="h-8 w-8 text-primary/8" />
                  </div>

                  {/* Star Rating */}
                  <div className="mb-4">
                    <StarRating rating={testimonial.rating} />
                  </div>

                  {/* Testimonial text */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">&ldquo;{testimonial.text}&rdquo;</p>

                  {/* Author info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="relative">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{testimonial.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{testimonial.role}</p>
                      <p className="text-xs text-primary font-medium truncate">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
