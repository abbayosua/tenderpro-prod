'use client';

import { Mail, Phone, MapPin } from 'lucide-react';

export function FooterSection() {
  return (
    <footer className="relative z-10 bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="TenderPro" className="h-10 w-auto" />
              <span className="text-3xl font-bold">TenderPro</span>
            </div>
            <p className="text-slate-400 mb-6">Platform penghubung kontraktor dan pemilik proyek konstruksi terpercaya di Indonesia.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg">Tautan Cepat</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#contractors" className="hover:text-primary transition-colors">Kontraktor</a></li>
              <li><a href="#projects" className="hover:text-primary transition-colors">Proyek</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">Cara Kerja</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg">Kategori Proyek</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-primary transition-colors">Pembangunan Rumah</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Renovasi</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Komersial</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg">Kontak</h4>
            <ul className="space-y-3 text-slate-400">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary/70" /> <span>info@tenderpro.id</span></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary/70" /> <span>021-12345678</span></li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary/70" /> <span>Jakarta, Indonesia</span></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
          <p>© 2024 TenderPro. Semua hak dilindungi undang-undang.</p>
        </div>
      </div>
    </footer>
  );
}
