'use client';

import { Button } from '@/components/ui/button';
import { User, Building2, CheckCircle } from 'lucide-react';

interface CTASectionProps {
  onRegister: (role: 'OWNER' | 'CONTRACTOR') => void;
}

export function CTASection({ onRegister }: CTASectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Memulai Proyek Anda?</h2>
        <p className="text-xl text-primary-foreground/80 mb-8">Bergabung dengan ribuan pemilik proyek dan kontraktor yang telah mempercayai TenderPro</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto" onClick={() => onRegister('OWNER')}>
            <User className="h-5 w-5 mr-2" /> Daftar sebagai Pemilik Proyek
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto" onClick={() => onRegister('CONTRACTOR')}>
            <Building2 className="h-5 w-5 mr-2" /> Daftar sebagai Kontraktor
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 text-primary-foreground/80">
          <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> <span>Gratis Mendaftar</span></div>
          <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> <span>Proses Cepat</span></div>
          <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> <span>Transaksi Aman</span></div>
        </div>
      </div>
    </section>
  );
}
