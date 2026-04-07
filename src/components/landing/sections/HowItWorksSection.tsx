'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Upload, Search, Send, UserPlus, Shield, FolderSearch, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const ownerSteps = [
  { step: 1, title: 'Daftar Akun', desc: 'Buat akun sebagai pemilik proyek dan lengkapi profil perusahaan', icon: UserPlus },
  { step: 2, title: 'Pasang Proyek', desc: 'Unggah detail proyek beserta persyaratan dan anggaran', icon: ClipboardList },
  { step: 3, title: 'Pilih Penawaran', desc: 'Review dan pilih penawaran terbaik dari kontraktor terverifikasi', icon: Search },
  { step: 4, title: 'Mulai Proyek', desc: 'Konfirmasi kontraktor pilihan dan mulai pengerjaan proyek', icon: Send },
];

const contractorSteps = [
  { step: 1, title: 'Daftar Akun', desc: 'Buat akun sebagai kontraktor dan lengkapi profil perusahaan', icon: UserPlus },
  { step: 2, title: 'Verifikasi', desc: 'Unggah dokumen legalitas untuk proses verifikasi dan sertifikasi', icon: Shield },
  { step: 3, title: 'Cari Proyek', desc: 'Temukan proyek yang sesuai dengan keahlian dan lokasi Anda', icon: FolderSearch },
  { step: 4, title: 'Ajukan Penawaran', desc: 'Kirim proposal lengkap beserta penawaran harga kompetitif', icon: FileText },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
} as const;

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

function StepCard({ step, title, desc, icon: Icon, color }: {
  step: number;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div variants={stepVariants} className="relative flex flex-col items-center text-center group">
      {/* Connecting line (except last) */}
      {step < 4 && (
        <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] w-[calc(100%-64px)] h-0.5 bg-gradient-to-r from-slate-200 to-slate-100" />
      )}

      {/* Step number badge */}
      <div className="relative z-10 mb-5">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-100`}>
          {step}
        </div>
      </div>

      <h3 className="font-bold text-lg mb-2 text-slate-800">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed max-w-[220px]">{desc}</p>
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="max-w-7xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block mb-3 text-xs font-semibold tracking-wider text-primary uppercase">Proses Mudah</span>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 md:text-4xl">Cara Kerja TenderPro</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Langkah sederhana untuk memulai proyek konstruksi Anda</p>
        </motion.div>

        <Tabs defaultValue="owner" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="owner" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">Sebagai Pemilik Proyek</TabsTrigger>
            <TabsTrigger value="contractor" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">Sebagai Kontraktor</TabsTrigger>
          </TabsList>

          <TabsContent value="owner">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              className="grid md:grid-cols-4 gap-8 md:gap-6"
            >
              {ownerSteps.map((item) => (
                <StepCard key={item.step} {...item} color="from-primary to-teal-600" />
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="contractor">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              className="grid md:grid-cols-4 gap-8 md:gap-6"
            >
              {contractorSteps.map((item) => (
                <StepCard key={item.step} {...item} color="from-teal-600 to-emerald-600" />
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
