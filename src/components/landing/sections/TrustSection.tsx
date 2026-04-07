'use client';

import { Shield, Scale, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const trustItems = [
  {
    icon: Shield,
    title: 'Terverifikasi',
    desc: 'Semua kontraktor dan pemilik proyek melalui proses verifikasi dokumen yang ketat untuk menjamin keamanan transaksi',
    gradient: 'from-primary/10 to-teal-500/5',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    borderAccent: 'border-l-primary',
  },
  {
    icon: Scale,
    title: 'Transparan',
    desc: 'Proses tender yang transparan dengan informasi lengkap mengenai proyek, kontraktor, dan progres pengerjaan',
    gradient: 'from-teal-500/10 to-emerald-500/5',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-600',
    borderAccent: 'border-l-teal-500',
  },
  {
    icon: Award,
    title: 'Terpercaya',
    desc: 'Ribuan proyek telah berhasil diselesaikan melalui platform kami dengan tingkat kepuasan tinggi',
    gradient: 'from-amber-500/10 to-orange-500/5',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    borderAccent: 'border-l-amber-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

export function TrustSection() {
  return (
    <section className="relative z-10 py-20 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-40" />
      <div className="max-w-7xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block mb-3 text-xs font-semibold tracking-wider text-primary uppercase">Keunggulan Kami</span>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 md:text-4xl">Mengapa Memilih TenderPro?</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Platform yang dirancang khusus untuk kebutuhan industri konstruksi Indonesia</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {trustItems.map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`relative group rounded-2xl border border-slate-100 bg-gradient-to-br ${item.gradient} bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-slate-200 border-l-4 ${item.borderAccent} overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/3 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className={`w-14 h-14 ${item.iconBg} rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
