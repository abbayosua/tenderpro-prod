'use client';

import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

const footerLinks = {
  cepat: [
    { label: 'Kontraktor', href: '#contractors' },
    { label: 'Proyek', href: '#projects' },
    { label: 'Cara Kerja', href: '#how-it-works' },
    { label: 'Kontraktor Lokal', href: '#local-contractors' },
  ],
  kategori: [
    { label: 'Pembangunan Rumah', href: '#categories' },
    { label: 'Renovasi', href: '#categories' },
    { label: 'Komersial', href: '#categories' },
    { label: 'Interior', href: '#categories' },
  ],
  kontak: [
    { icon: Mail, text: 'info@tenderpro.id' },
    { icon: Phone, text: '021-12345678' },
    { icon: MapPin, text: 'Jakarta, Indonesia' },
  ],
  sosial: [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' },
  ],
};

export function FooterSection() {
  return (
    <footer className="relative z-10 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Decorative top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.png" alt="TenderPro" className="h-10 w-auto" />
              <span className="text-3xl font-bold tracking-tight">TenderPro</span>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed max-w-sm">
              Platform penghubung kontraktor dan pemilik proyek konstruksi terpercaya di Indonesia. Membangun Indonesia lebih baik.
            </p>
            {/* Social media icons */}
            <div className="flex items-center gap-3">
              {footerLinks.sosial.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 transition-all duration-200 hover:bg-primary/20 hover:border-primary/30 hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-5 text-base text-white">Tautan Cepat</h4>
            <ul className="space-y-3">
              {footerLinks.cepat.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 text-sm transition-colors duration-200 hover:text-white hover:translate-x-1 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-5 text-base text-white">Kategori Proyek</h4>
            <ul className="space-y-3">
              {footerLinks.kategori.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 text-sm transition-colors duration-200 hover:text-white hover:translate-x-1 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-5 text-base text-white">Kontak</h4>
            <ul className="space-y-4">
              {footerLinks.kontak.map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-slate-400 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-3.5 w-3.5 text-primary/70" />
                  </div>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} TenderPro. Semua hak dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors duration-200">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
