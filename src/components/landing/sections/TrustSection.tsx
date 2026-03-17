'use client';

import { Shield, Target, Handshake } from 'lucide-react';

const trustItems = [
  { icon: Shield, title: 'Terverifikasi', desc: 'Semua kontraktor dan pemilik proyek melalui proses verifikasi dokumen yang ketat' },
  { icon: Target, title: 'Transparan', desc: 'Proses tender yang transparan dengan informasi lengkap mengenai proyek dan kontraktor' },
  { icon: Handshake, title: 'Terpercaya', desc: 'Ribuan proyek telah berhasil diselesaikan melalui platform kami' },
];

export function TrustSection() {
  return (
    <section className="relative z-10 py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Mengapa Memilih TenderPro?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {trustItems.map((item) => (
            <div key={item.title} className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
