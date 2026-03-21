'use client';

import { Button } from '@/components/ui/button';
import { User, Building2, CheckCircle, TrendingUp, Star } from 'lucide-react';

interface HeroSectionProps {
  onRegister: (role: 'OWNER' | 'CONTRACTOR') => void;
}

export function HeroSection({ onRegister }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden pb-10 pt-20 md:pb-16 md:pt-24">
      <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center md:max-w-4xl md:px-6 lg:max-w-7xl">
        <span className="mb-6 inline-block rounded-full border border-primary/30 px-4 py-1.5 text-xs font-medium text-primary">
          PLATFORM TENDER KONSTRUKSI TERPERCAYA
        </span>
        <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold text-slate-900 md:text-5xl lg:text-6xl">
          Hubungkan Kontraktor &{' '}
          <span className="text-primary">Pemilik Proyek</span> Terpercaya
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 md:text-xl">
          Platform tender konstruksi terpercaya di Indonesia. Temukan kontraktor berkualitas atau dapatkan proyek impian Anda dengan mudah dan aman.
        </p>
        <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="w-full rounded-full bg-primary px-8 py-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-primary/90 sm:w-auto" onClick={() => onRegister('OWNER')}>
            <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
          </Button>
          <Button size="lg" variant="outline" className="w-full rounded-full border-slate-300 px-8 py-6 text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 sm:w-auto" onClick={() => onRegister('CONTRACTOR')}>
            <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
          {[
            { icon: CheckCircle, value: '500+', label: 'Proyek Selesai' },
            { icon: TrendingUp, value: 'Rp 50M+', label: 'Nilai Proyek' },
            { icon: Building2, value: '150+', label: 'Kontraktor Aktif' },
            { icon: Star, value: '4.8', label: 'Rating Rata-rata' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <stat.icon className="h-6 w-6 text-primary mb-2" />
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
