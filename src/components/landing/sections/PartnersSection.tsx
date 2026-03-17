'use client';

import { Shield, CheckCircle, FileCheck, Handshake } from 'lucide-react';
import { partners } from '@/data';

const badges = [
  { icon: Shield, text: 'ISO 9001:2015' },
  { icon: CheckCircle, text: 'Terdaftar di Kemenparekraf' },
  { icon: FileCheck, text: 'Verifikasi Dokumen Ketat' },
  { icon: Handshake, text: 'Garansi Transaksi Aman' },
];

export function PartnersSection() {
  return (
    <section className="relative z-10 py-12 bg-white border-y">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Partner</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {partners.map((partner, index) => (
            <div key={index} className="flex items-center justify-center h-12 md:h-14 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src={partner.logo} alt={partner.name} className="h-full w-auto object-contain max-w-[120px] md:max-w-[150px]" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2 text-slate-600">
              <badge.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
